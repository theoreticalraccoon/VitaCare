import { supabase } from '@/lib/supabase';
import { secureStorage } from '@/lib/secureStorage';
import { normalizeUsername, usernameToEmail } from '@/lib/auth';
import { DoseLog, Medication, UserData } from '@/types';
import {
  AppUser,
  AuthOutcome,
  Backend,
  freshUserData,
  SessionSnapshot,
} from './defaults';

/** Turns raw Supabase auth errors into friendly, username-oriented messages. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists')) {
    return 'That username is already taken.';
  }
  if (m.includes('invalid login')) {
    return 'Incorrect username or password.';
  }
  if (m.includes('email not confirmed')) {
    return 'Account not confirmed yet. Disable email confirmation in Supabase for username login.';
  }
  return message;
}

function cacheKey(userId: string) {
  return `vitacare:cloudcache:${userId}`;
}

/** The device's IANA timezone, so the server can judge missed doses in local time. */
function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function client() {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase;
}

/** Maps a profiles row + medications + dose_logs into our UserData shape. */
function rowsToData(
  profile: any,
  meds: any[],
  logs: any[]
): UserData {
  const medications: Medication[] = (meds ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    dosage: m.dosage ?? undefined,
    time: m.time,
    color: m.color,
  }));

  const logMap: Record<string, DoseLog> = {};
  for (const l of logs ?? []) {
    logMap[l.id] = {
      id: l.id,
      medicationId: l.medication_id ?? '',
      medicationName: l.medication_name,
      date: l.date,
      scheduledTime: l.scheduled_time,
      status: l.status,
      confirmedAt: l.confirmed_at ?? undefined,
      minutesLate: l.minutes_late ?? 0,
      escalations: l.escalations ?? [],
    };
  }

  return {
    hasOnboarded: profile?.has_onboarded ?? false,
    medications,
    channels: {
      notification: profile?.notify_push ?? true,
      email: profile?.notify_email ?? false,
      phoneAlarm: profile?.notify_alarm ?? false,
    },
    caregivers: {
      primaryName: profile?.primary_name ?? '',
      primaryEmail: profile?.primary_email ?? '',
      secondaryName: profile?.secondary_name ?? '',
      secondaryEmail: profile?.secondary_email ?? '',
    },
    logs: logMap,
  };
}

async function readCache(userId: string): Promise<SessionSnapshot | null> {
  try {
    const raw = await secureStorage.getItem(cacheKey(userId));
    return raw ? (JSON.parse(raw) as SessionSnapshot) : null;
  } catch {
    return null;
  }
}

async function loadSnapshot(user: AppUser): Promise<SessionSnapshot> {
  const sb = client();
  try {
    const [{ data: profile }, { data: meds }, { data: logs }] =
      await Promise.all([
        sb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        sb.from('medications').select('*').eq('user_id', user.id),
        sb.from('dose_logs').select('*').eq('user_id', user.id),
      ]);

    const name = profile?.full_name || user.name;
    const data = rowsToData(profile, meds ?? [], logs ?? []);
    const snapshot = { user: { ...user, name }, data };
    await secureStorage.setItem(cacheKey(user.id), JSON.stringify(snapshot));
    return snapshot;
  } catch {
    // Offline: fall back to cached snapshot if present.
    const cached = await secureStorage.getItem(cacheKey(user.id));
    if (cached) return JSON.parse(cached) as SessionSnapshot;
    return { user, data: freshUserData() };
  }
}

function sessionUser(authUser: {
  id: string;
  email?: string;
  user_metadata?: any;
}): AppUser {
  const meta = authUser.user_metadata ?? {};
  const username = meta.username ?? authUser.email?.split('@')[0] ?? '';
  return {
    id: authUser.id,
    username,
    name: meta.full_name ?? '',
  };
}

/** Supabase-backed backend: real auth + permanent storage. */
export const cloudBackend: Backend = {
  mode: 'cloud',

  async restore(): Promise<SessionSnapshot | null> {
    const sb = client();
    const { data } = await sb.auth.getSession();
    if (!data.session?.user) return null;
    const user = sessionUser(data.session.user);
    // Cache-first: return instantly if we have a cached snapshot; the context
    // will call revalidate() to refresh from the network in the background.
    const cached = await readCache(user.id);
    if (cached) {
      return { user: { ...user, name: cached.user.name || user.name }, data: cached.data };
    }
    return loadSnapshot(user);
  },

  async revalidate(user: AppUser): Promise<SessionSnapshot | null> {
    try {
      return await loadSnapshot(user);
    } catch {
      return null;
    }
  },

  async signUp(input): Promise<AuthOutcome> {
    const sb = client();
    const username = normalizeUsername(input.username);
    const { data, error } = await sb.auth.signUp({
      email: usernameToEmail(username),
      password: input.password,
      options: { data: { full_name: input.name.trim(), username } },
    });
    if (error) return { ok: false, error: friendlyAuthError(error.message) };

    if (!data.session) {
      // Email confirmation is still enabled — username login needs it OFF.
      return { ok: true, needsVerification: true };
    }
    const user = sessionUser(data.user!);
    return {
      ok: true,
      session: await loadSnapshot({ ...user, name: input.name.trim(), username }),
    };
  },

  async signIn(input): Promise<AuthOutcome> {
    const sb = client();
    const { data, error } = await sb.auth.signInWithPassword({
      email: usernameToEmail(input.username),
      password: input.password,
    });
    if (error) return { ok: false, error: friendlyAuthError(error.message) };
    return { ok: true, session: await loadSnapshot(sessionUser(data.user)) };
  },

  async signOut(): Promise<void> {
    await client().auth.signOut();
  },

  async deleteAccount(user: AppUser): Promise<{ ok: boolean; error?: string }> {
    const sb = client();
    // The Edge Function deletes the auth user (admin) which cascades all rows.
    const { error } = await sb.functions.invoke('delete-account', { body: {} });
    if (error) {
      return { ok: false, error: 'Could not delete your account. Please try again.' };
    }
    await secureStorage.removeItem(cacheKey(user.id));
    await sb.auth.signOut().catch(() => {});
    return { ok: true };
  },

  async persist(userId: string, data: UserData): Promise<void> {
    const sb = client();
    // Cache immediately for offline resilience.
    const cached = await secureStorage.getItem(cacheKey(userId));
    const prevUser = cached ? (JSON.parse(cached) as SessionSnapshot).user : null;
    await secureStorage.setItem(
      cacheKey(userId),
      JSON.stringify({ user: prevUser ?? { id: userId, name: '', username: '' }, data })
    );

    const warn = (label: string, error: { message: string } | null) => {
      if (error) console.warn(`[VitaCare] ${label} sync failed: ${error.message}`);
    };

    try {
      // Profile (prefs + caregivers + onboarding flag).
      const profileRes = await sb.from('profiles').upsert({
        id: userId,
        has_onboarded: data.hasOnboarded,
        notify_push: data.channels.notification,
        notify_email: data.channels.email,
        notify_alarm: data.channels.phoneAlarm,
        primary_name: data.caregivers.primaryName,
        primary_email: data.caregivers.primaryEmail,
        secondary_name: data.caregivers.secondaryName,
        secondary_email: data.caregivers.secondaryEmail,
        timezone: deviceTimeZone(),
        updated_at: new Date().toISOString(),
      });
      warn('profile', profileRes.error);

      // Medications: reconcile (upsert current, delete removed).
      if (data.medications.length > 0) {
        const medRes = await sb.from('medications').upsert(
          data.medications.map((m) => ({
            id: m.id,
            user_id: userId,
            name: m.name,
            dosage: m.dosage ?? null,
            time: m.time,
            color: m.color,
          }))
        );
        warn('medications', medRes.error);
      }
      const { data: existing } = await sb
        .from('medications')
        .select('id')
        .eq('user_id', userId);
      const keep = new Set(data.medications.map((m) => m.id));
      const toDelete = (existing ?? [])
        .map((r: any) => r.id)
        .filter((id: string) => !keep.has(id));
      if (toDelete.length > 0) {
        const delRes = await sb.from('medications').delete().in('id', toDelete);
        warn('medications delete', delRes.error);
      }

      // Dose logs: upsert (history is append/update only).
      const logs = Object.values(data.logs);
      if (logs.length > 0) {
        const logRes = await sb.from('dose_logs').upsert(
          logs.map((l) => ({
            id: l.id,
            user_id: userId,
            medication_id: l.medicationId || null,
            medication_name: l.medicationName,
            date: l.date,
            scheduled_time: l.scheduledTime,
            status: l.status,
            confirmed_at: l.confirmedAt ?? null,
            minutes_late: l.minutesLate ?? 0,
            escalations: l.escalations,
          }))
        );
        warn('dose_logs', logRes.error);
      }
    } catch (e) {
      console.warn('[VitaCare] cloud sync error:', e);
    }
  },
};
