// Supabase Edge Function: delete-account
// Permanently deletes the signed-in user's account and all their data.
//
// Required for App Store (Guideline 5.1.1(v)) and Google Play: an app that lets
// users create an account must let them delete it in-app. Deleting an auth user
// needs admin rights, so it must happen here (not from the client).
//
// Deleting the auth user cascades to profiles / medications / dose_logs via the
// `on delete cascade` foreign keys in schema.sql.
//
// Deploy (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected):
//   supabase functions deploy delete-account

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Authenticate the caller — they can only delete *their own* account.
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authErr } = await admin.auth.getUser(jwt);
    if (authErr || !auth.user) return json({ error: 'Unauthorized' }, 401);

    // Cascade-deletes profiles, medications, and dose_logs via FK constraints.
    const { error: delErr } = await admin.auth.admin.deleteUser(auth.user.id);
    if (delErr) return json({ error: 'Delete failed' }, 500);

    return json({ ok: true });
  } catch {
    return json({ error: 'Internal error' }, 500);
  }
});
