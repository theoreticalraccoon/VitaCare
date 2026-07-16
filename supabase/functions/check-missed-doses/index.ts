// Supabase Edge Function: check-missed-doses
// The "real accountability" job. Runs on a schedule (pg_cron, e.g. every 15 min),
// finds doses whose time has passed today WITHOUT confirmation, and emails the
// caregiver chain automatically — even if the patient never opens the app.
//
// Escalation:
//   • > LATE_MIN unconfirmed   → email primary caregiver
//   • > MISSED_MIN unconfirmed → also email secondary contact
// It records a `dose_logs` row (status 'missed') so it never re-emails the same
// dose, and so the miss shows up in the patient's History.
//
// Deploy with verify_jwt OFF (it's called by cron, not a user) and protect it
// with a shared CRON_SECRET. Secrets needed: RESEND_API_KEY, ALERT_FROM,
// CRON_SECRET. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ALERT_FROM = Deno.env.get('ALERT_FROM') ?? 'VitaCare <onboarding@resend.dev>';
const CRON_SECRET = Deno.env.get('CRON_SECRET');

const LATE_MIN = 30; // primary alerted after this many minutes unconfirmed
const MISSED_MIN = 120; // secondary added after this many minutes unconfirmed

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}

/** Current minutes-since-midnight and YYYY-MM-DD in a given IANA timezone. */
function localNow(tz: string): { nowMin: number; dateStr: string } {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
    let hour = Number(get('hour'));
    if (hour === 24) hour = 0; // some runtimes emit 24 at midnight
    return {
      nowMin: hour * 60 + Number(get('minute')),
      dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    };
  } catch {
    const d = new Date();
    return {
      nowMin: d.getUTCHours() * 60 + d.getUTCMinutes(),
      dateStr: d.toISOString().slice(0, 10),
    };
  }
}

async function sendEmail(
  to: string,
  name: string,
  level: 'primary' | 'secondary',
  patientName: string,
  medicationName: string,
  minutesLate: number
): Promise<boolean> {
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#215944;margin-bottom:4px">VitaCare alert</h2>
      <p style="color:#0E1A15;font-size:15px;line-height:22px">
        Hi ${esc(name)}, ${esc(patientName)} has not taken <strong>${esc(
          medicationName
        )}</strong> — it's now ${esc(minutesLate)} minutes past the scheduled time and unconfirmed.
      </p>
      <p style="color:#5A6B64;font-size:13px">
        You're receiving this as the ${esc(level)} contact in their care circle.
      </p>
    </div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: ALERT_FROM,
      to: [to],
      subject: `VitaCare: ${patientName} missed ${medicationName}`,
      html,
    }),
  });
  return res.ok;
}

serve(async (req) => {
  // Only the scheduler (which knows CRON_SECRET) may invoke this.
  if (CRON_SECRET) {
    const auth = req.headers.get('Authorization') ?? '';
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'Email not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  let sent = 0;

  const { data: profiles } = await admin
    .from('profiles')
    .select(
      'id, full_name, primary_name, primary_email, secondary_name, secondary_email, notify_email, timezone'
    );

  for (const p of profiles ?? []) {
    if (!p.notify_email || !p.primary_email) continue;

    const { nowMin, dateStr } = localNow(p.timezone || 'UTC');

    const { data: meds } = await admin
      .from('medications')
      .select('id, name, time')
      .eq('user_id', p.id);
    if (!meds?.length) continue;

    const { data: logs } = await admin
      .from('dose_logs')
      .select('medication_id, status, escalations')
      .eq('user_id', p.id)
      .eq('date', dateStr);
    const byMed = new Map((logs ?? []).map((l: any) => [l.medication_id, l]));

    for (const med of meds) {
      const [h, m] = String(med.time).split(':').map(Number);
      const lateBy = nowMin - (h * 60 + m);
      if (lateBy < LATE_MIN) continue; // not late enough yet (or earlier today)

      const existing: any = byMed.get(med.id);
      if (existing && (existing.status === 'taken' || existing.status === 'late')) {
        continue; // already confirmed by the patient/caregiver
      }

      const already: string[] = existing?.escalations ?? [];
      const toSend: ('primary' | 'secondary')[] = [];
      if (!already.includes('primary')) toSend.push('primary');
      if (lateBy >= MISSED_MIN && p.secondary_email && !already.includes('secondary')) {
        toSend.push('secondary');
      }
      if (toSend.length === 0) continue;

      const patientName = p.full_name || 'The patient';
      for (const level of toSend) {
        const to = level === 'primary' ? p.primary_email : p.secondary_email;
        const name =
          level === 'primary'
            ? p.primary_name || 'Primary caregiver'
            : p.secondary_name || 'Secondary contact';
        const ok = await sendEmail(to, name, level, patientName, med.name, lateBy);
        if (ok) sent++;
      }

      const escalations = Array.from(new Set([...already, ...toSend]));
      await admin.from('dose_logs').upsert({
        id: `${med.id}-${dateStr}`,
        user_id: p.id,
        medication_id: med.id,
        medication_name: med.name,
        date: dateStr,
        scheduled_time: med.time,
        status: 'missed',
        minutes_late: lateBy,
        escalations,
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
