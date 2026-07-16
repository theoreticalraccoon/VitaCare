# VitaCare — Backend Setup (Supabase + Resend)

VitaCare works **offline out of the box**. Follow this to switch on **real
authentication, a permanent cloud database, and caregiver email alerts**.

Everything below is free-tier friendly. Takes ~10 minutes.

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> → sign in → **New project**.
2. Pick a name + database password, choose a region close to you, create it.
3. Wait ~2 min for it to provision.

## 2. Apply the database schema

1. In the project, open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Click **Run**. This creates the `profiles`, `medications`, and `dose_logs`
   tables, row-level security (each user sees only their own data), and a
   trigger that auto-creates a profile on sign-up.

## 3. Connect the app

1. In Supabase: **Project Settings → API**. Copy the **Project URL** and the
   **anon / public** key.
2. In the project root, copy `.env.example` to `.env` and fill them in:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

3. Restart the dev server so the env vars load:

   ```bash
   npx expo start --clear
   ```

The app now shows a green **"Synced"** state, and sign-up/sign-in go through
real Supabase auth. Sign up on two devices with the same account and the data
matches.

### ⚠️ Required for username login: turn OFF "Confirm email"
VitaCare signs users in with a **username + password**. Supabase Auth is
email-based under the hood, so each username is mapped to an internal synthetic
email (`username@vitacare.app`) that can't receive mail. You **must** disable
email confirmation or accounts can never be confirmed and login will fail:

**Authentication → Providers → Email → turn OFF "Confirm email" → Save.**

(Usernames stay unique because the derived email is unique; the username is also
stored in `profiles.username`.)

---

## 4. Caregiver email alerts (Resend)

You don't need the Supabase CLI — everything below can be done in the **Supabase
Dashboard**. (CLI commands are listed at the end if you prefer.)

### Step 0 — Get a Resend API key (shared by both features)
1. Create a free account at <https://resend.com> → **API Keys → Create**. Copy the
   `re_...` key.
2. (Optional) Verify a sending domain. For testing you can send from
   `onboarding@resend.dev` without a domain.

### Step 1 — Set the secrets (Dashboard → Edge Functions → Secrets)
Add these project secrets:
| Name | Value |
|---|---|
| `RESEND_API_KEY` | your `re_...` key |
| `ALERT_FROM` | e.g. `VitaCare <onboarding@resend.dev>` |
| `CRON_SECRET` | any long random string (for Feature B) |

### Step 2 — Deploy the three Edge Functions
In **Dashboard → Edge Functions → Deploy a new function**, create each one and
paste the code from this repo:

| Function | Code file | Verify JWT |
|---|---|---|
| `notify-caregiver` | `supabase/functions/notify-caregiver/index.ts` | **ON** (default) |
| `delete-account` | `supabase/functions/delete-account/index.ts` | **ON** (default) |
| `check-missed-doses` | `supabase/functions/check-missed-doses/index.ts` | **OFF** (cron calls it) |

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are auto-injected — you never set them.

> **(A) Late-dose emails — now live.** When the patient *confirms* a dose late
> (Email channel on + a caregiver email set), the app calls `notify-caregiver`
> and the caregiver gets an email. It authenticates the caller and reads
> recipients from *their own* profile, so it can't be abused as an open relay.

### Step 3 — (B) Automatic missed-dose alerts (the scheduler)
This emails caregivers when a dose time passes and **nobody confirms** — even if
the app is never opened.

1. Make sure the **`timezone` column** exists (re-run `supabase/schema.sql`, or
   run `alter table public.profiles add column if not exists timezone text;`).
   The app records each user's timezone automatically on next sync.
2. Confirm `check-missed-doses` is deployed with **Verify JWT OFF** and that
   `CRON_SECRET` is set (Step 1).
3. Open `supabase/missed-dose-cron.sql`, replace `PASTE_YOUR_CRON_SECRET_HERE`
   with the same `CRON_SECRET` value, and run it in the **SQL Editor**. It
   enables `pg_cron` + `pg_net` and runs the function every 15 minutes.

Escalation: a dose unconfirmed **>30 min** emails the primary caregiver; **>120
min** also emails the secondary contact. Each miss is recorded once (no repeat
emails) and shows up in the patient's History.

> Test it: add a medication with a time a few minutes in the past, set a caregiver
> email + Email toggle on, **don't** confirm it, and either wait for the cron or
> trigger the function manually from the dashboard. Watch `cron.job_run_details`
> and your inbox.

### CLI alternative (if you have the Supabase CLI)
```bash
supabase login && supabase link --project-ref gufsgyrmaisqucnvmbrb
supabase secrets set RESEND_API_KEY=re_xxx ALERT_FROM="VitaCare <onboarding@resend.dev>" CRON_SECRET=your-long-random-string
supabase functions deploy notify-caregiver
supabase functions deploy delete-account
supabase functions deploy check-missed-doses --no-verify-jwt
# then run supabase/missed-dose-cron.sql in the SQL editor
```

---

## 5. Notifications & alarms (development build)

Local reminders + alarm sounds are coded and scheduled, but **Expo Go cannot run
them fully**. To get real device notifications/alarms, make a development build:

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

Install the resulting APK, run `npx expo start --dev-client`, and reminders fire
natively at each dose time.

---

## What works where

| Feature | Offline (Expo Go) | Cloud configured | Dev build |
|---|---|---|---|
| Auth (sign up / in) | ✅ local | ✅ real Supabase | ✅ |
| Medicine + history storage | ✅ on-device | ✅ permanent DB | ✅ |
| Caregiver email alerts | shown in-app | ✅ real emails | ✅ |
| Push reminders / alarms | partial | partial in Expo Go | ✅ full |
