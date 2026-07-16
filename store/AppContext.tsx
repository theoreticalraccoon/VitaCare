import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Crypto from 'expo-crypto';
import { confirmDose, nextDoseColor } from '@/lib/adherence';
import { isSupabaseConfigured } from '@/lib/supabase';
import { notifyCaregivers } from '@/lib/caregiverAlerts';
import { syncReminders } from '@/lib/notifications';
import { todayKey } from '@/lib/time';
import {
  Caregivers,
  DoseLog,
  Medication,
  ReminderChannels,
  UserData,
} from '@/types';
import { cloudBackend } from './cloudBackend';
import { localBackend } from './localBackend';
import { AppUser, AuthOutcome, Backend } from './defaults';

/** Pick the backend once: real cloud when configured, else offline-local. */
const backend: Backend = isSupabaseConfigured ? cloudBackend : localBackend;

interface AppContextValue {
  isLoading: boolean;
  /** True when connected to the real Supabase backend. */
  isCloud: boolean;
  user: AppUser | null;
  data: UserData | null;

  signUp: (input: {
    name: string;
    username: string;
    password: string;
  }) => Promise<AuthOutcome>;
  signIn: (input: {
    username: string;
    password: string;
  }) => Promise<AuthOutcome>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>;

  completeOnboarding: () => void;
  setChannels: (channels: ReminderChannels) => void;
  setCaregivers: (caregivers: Caregivers) => void;

  addMedication: (name: string, time: string, dosage?: string) => void;
  updateMedication: (
    id: string,
    fields: Partial<Pick<Medication, 'name' | 'time' | 'dosage'>>
  ) => void;
  removeMedication: (id: string) => void;
  confirmDoseFor: (med: Medication) => void;

  todaysLog: (medicationId: string) => DoseLog | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [data, setData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Set once the user edits locally, so a background refresh can't clobber it. */
  const dirty = useRef(false);

  // Restore any existing session on mount (cache-first), then revalidate.
  useEffect(() => {
    (async () => {
      try {
        const snapshot = await backend.restore();
        if (snapshot) {
          setUser(snapshot.user);
          setData(snapshot.data);
          // Background refresh from the network; reconcile unless the user has
          // already made local changes this session.
          backend
            .revalidate(snapshot.user)
            .then((fresh) => {
              if (fresh && !dirty.current) {
                setUser(fresh.user);
                setData(fresh.data);
              }
            })
            .catch(() => {});
        }
      } catch {
        // ignore — land on auth
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Keep OS reminders in sync with the active schedule.
  useEffect(() => {
    if (!data?.hasOnboarded) return;
    syncReminders(data.medications, data.channels);
  }, [data?.medications, data?.channels, data?.hasOnboarded]);

  /** Debounced persistence of the active user's data via the backend. */
  const schedulePersist = useCallback(
    (userId: string, next: UserData) => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        backend.persist(userId, next).catch(() => {});
      }, 600);
    },
    []
  );

  /** Update the active user's data and persist. */
  const mutate = useCallback(
    (fn: (d: UserData) => UserData) => {
      dirty.current = true;
      setData((prev) => {
        if (!prev || !user) return prev;
        const next = fn(prev);
        schedulePersist(user.id, next);
        return next;
      });
    },
    [user, schedulePersist]
  );

  const signUp = useCallback<AppContextValue['signUp']>(async (input) => {
    const outcome = await backend.signUp(input);
    if (outcome.ok && outcome.session) {
      setUser(outcome.session.user);
      setData(outcome.session.data);
    }
    return outcome;
  }, []);

  const signIn = useCallback<AppContextValue['signIn']>(async (input) => {
    const outcome = await backend.signIn(input);
    if (outcome.ok && outcome.session) {
      dirty.current = false;
      setUser(outcome.session.user);
      setData(outcome.session.data);
    }
    return outcome;
  }, []);

  const signOut = useCallback(async () => {
    await backend.signOut();
    dirty.current = false;
    setUser(null);
    setData(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    const result = await backend.deleteAccount(user);
    if (result.ok) {
      dirty.current = false;
      setUser(null);
      setData(null);
    }
    return result;
  }, [user]);

  const completeOnboarding = useCallback(
    () => mutate((d) => ({ ...d, hasOnboarded: true })),
    [mutate]
  );

  const setChannels = useCallback(
    (channels: ReminderChannels) => mutate((d) => ({ ...d, channels })),
    [mutate]
  );

  const setCaregivers = useCallback(
    (caregivers: Caregivers) => mutate((d) => ({ ...d, caregivers })),
    [mutate]
  );

  const addMedication = useCallback(
    (name: string, time: string, dosage?: string) =>
      mutate((d) => ({
        ...d,
        medications: [
          ...d.medications,
          {
            id: makeId(),
            name: name.trim(),
            dosage: dosage?.trim() || undefined,
            time,
            color: nextDoseColor(d.medications),
          },
        ],
      })),
    [mutate]
  );

  const updateMedication = useCallback<AppContextValue['updateMedication']>(
    (id, fields) =>
      mutate((d) => ({
        ...d,
        medications: d.medications.map((m) =>
          m.id === id
            ? {
                ...m,
                ...fields,
                name: fields.name?.trim() ?? m.name,
                dosage:
                  fields.dosage !== undefined
                    ? fields.dosage.trim() || undefined
                    : m.dosage,
              }
            : m
        ),
      })),
    [mutate]
  );

  const removeMedication = useCallback(
    (id: string) =>
      mutate((d) => ({
        ...d,
        medications: d.medications.filter((m) => m.id !== id),
      })),
    [mutate]
  );

  const confirmDoseFor = useCallback(
    (med: Medication) => {
      const log = confirmDose(med);
      mutate((d) => {
        // Escalate to caregivers on a late/missed dose.
        if (log.escalations.length > 0) {
          notifyCaregivers(d.caregivers, d.channels, {
            patientName: user?.name ?? 'The patient',
            medicationName: med.name,
            status: log.status,
            minutesLate: log.minutesLate ?? 0,
            levels: log.escalations,
          });
        }
        return { ...d, logs: { ...d.logs, [log.id]: log } };
      });
    },
    [mutate, user]
  );

  const todaysLog = useCallback(
    (medicationId: string) => data?.logs[`${medicationId}-${todayKey()}`],
    [data?.logs]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      isLoading,
      isCloud: backend.mode === 'cloud',
      user,
      data,
      signUp,
      signIn,
      signOut,
      deleteAccount,
      completeOnboarding,
      setChannels,
      setCaregivers,
      addMedication,
      updateMedication,
      removeMedication,
      confirmDoseFor,
      todaysLog,
    }),
    [
      isLoading,
      user,
      data,
      signUp,
      signIn,
      signOut,
      deleteAccount,
      completeOnboarding,
      setChannels,
      setCaregivers,
      addMedication,
      updateMedication,
      removeMedication,
      confirmDoseFor,
      todaysLog,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** A real UUID v4 — required because the DB stores medication ids as `uuid`. */
function makeId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    const b = Crypto.getRandomBytes(16);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, '0'));
    return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
  }
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
