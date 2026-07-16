// Supabase Edge Function: notify-caregiver
// Emails the signed-in user's OWN caregivers when a dose is late/missed.
//
// Security model (hardened):
//   • Authenticates the caller's JWT and derives their user id.
//   • Recipients come from the caller's profiles row (server-side), NEVER the
//     request body — so it can't be abused as an open email relay.
//   • All interpolated values are HTML-escaped.
//   • CORS is restricted; only POST is accepted; a simple per-user rate limit
//     is applied; errors are generic.
//
// Deploy (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected):
//   supabase functions deploy notify-caregiver
//   supabase secrets set RESEND_API_KEY=re_xxx
//   supabase secrets set ALERT_FROM="VitaCare <alerts@yourdomain.com>"
//   supabase secrets set ALLOWED_ORIGIN="https://yourapp.example"   # optional

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ALERT_FROM = Deno.env.get('ALERT_FROM') ?? 'VitaCare <onboarding@resend.dev>';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'null';

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  Vary: 'Origin',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// Escape user-controlled strings before placing them in HTML.
function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}

// Best-effort in-memory per-user rate limit (resets on cold start). For
// stronger guarantees back this with a table or Upstash/Redis.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(userId, recent);
  return false;
}

interface Caregiver {
  name: string;
  email: string;
  level: 'primary' | 'secondary';
}

function emailHtml(
  recipient: Caregiver,
  patientName: string,
  medicationName: string,
  status: string,
  minutesLate: number
): string {
  const what =
    status === 'missed'
      ? `did not take their dose of <strong>${esc(medicationName)}</strong>.`
      : `took <strong>${esc(medicationName)}</strong> ${esc(minutesLate)} minutes late.`;
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#0E9F6E;margin-bottom:4px">VitaCare alert</h2>
      <p style="color:#0C1B16;font-size:15px;line-height:22px">
        Hi ${esc(recipient.name)}, ${esc(patientName)} ${what}
      </p>
      <p style="color:#65756F;font-size:13px">
        You're receiving this as the ${esc(recipient.level)} contact in their care circle.
      </p>
    </div>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    if (!RESEND_API_KEY) return json({ error: 'Email not configured' }, 500);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1) Authenticate the caller from their JWT.
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authErr } = await admin.auth.getUser(jwt);
    if (authErr || !auth.user) return json({ error: 'Unauthorized' }, 401);
    const userId = auth.user.id;

    if (rateLimited(userId)) return json({ error: 'Too many requests' }, 429);

    // 2) Validate only the (non-identity) dose context from the body.
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid request' }, 400);
    }
    const medicationName = String(body?.medicationName ?? '').slice(0, 120);
    const status = body?.status === 'missed' ? 'missed' : 'late';
    const minutesLate = Number.isFinite(body?.minutesLate)
      ? Math.max(0, Math.floor(body.minutesLate))
      : 0;
    if (!medicationName) return json({ error: 'Invalid request' }, 400);

    // 3) Recipients are derived from the CALLER'S profile, never the body.
    const { data: profile, error: profErr } = await admin
      .from('profiles')
      .select(
        'full_name, primary_name, primary_email, secondary_name, secondary_email'
      )
      .eq('id', userId)
      .single();
    if (profErr || !profile) return json({ error: 'No profile' }, 404);

    const patientName = profile.full_name || 'The patient';
    const recipients: Caregiver[] = [];
    if (profile.primary_email) {
      recipients.push({
        name: profile.primary_name || 'Primary caregiver',
        email: profile.primary_email,
        level: 'primary',
      });
    }
    // Secondary contact is only escalated for a fully missed dose.
    if (status === 'missed' && profile.secondary_email) {
      recipients.push({
        name: profile.secondary_name || 'Secondary contact',
        email: profile.secondary_email,
        level: 'secondary',
      });
    }
    if (recipients.length === 0) return json({ sent: [] });

    // 4) Send.
    const results = [];
    for (const r of recipients) {
      const subject =
        status === 'missed'
          ? `VitaCare: ${patientName} missed ${medicationName}`
          : `VitaCare: ${patientName} took ${medicationName} late`;
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: ALERT_FROM,
          to: [r.email],
          subject,
          html: emailHtml(r, patientName, medicationName, status, minutesLate),
        }),
      });
      results.push({ level: r.level, ok: res.ok });
    }

    return json({ sent: results });
  } catch {
    // Generic error — never leak internals to the caller.
    return json({ error: 'Internal error' }, 500);
  }
});
