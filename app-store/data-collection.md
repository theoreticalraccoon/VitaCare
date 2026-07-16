# VitaCare — Data Collection Map

Generated from a scan of the codebase (Supabase `profiles`/`medications`/`dose_logs`,
the `notify-caregiver` Edge Function, expo-notifications, and on-device storage).
Use this to fill **Apple App Privacy** and **Google Play Data Safety**.

> Verified: **no analytics, ads, crash-reporting, or third-party tracking SDKs** are
> installed. No location, camera, contacts, photos, microphone, or device-ID access.

## What the app collects / stores / sends

| Data | What it is | Where stored | Linked to user identity? | Used for tracking? | Purpose |
|---|---|---|---|---|---|
| Name | `profiles.full_name` (display name) | Supabase (cloud, encrypted in transit) + encrypted on-device cache | **Yes** | **No** | App functionality (greeting, caregiver emails) |
| Username | `profiles.username` (also the synthetic login email `username@vitacare.app`) | Supabase + device keystore | **Yes** | **No** | Authentication |
| Password | Hashed by Supabase Auth (bcrypt) server-side; never stored in plaintext | Supabase Auth | **Yes** | **No** | Authentication |
| Health info — medications & adherence | `medications` (name, dose, time) and `dose_logs` (taken/late/missed, timestamps) | Supabase + encrypted on-device cache | **Yes** | **No** | Core app functionality |
| Caregiver/family contact emails & names | `profiles.primary_*` / `secondary_*` (emails of **other people** the user enters) | Supabase | **Yes** (to the user's account) | **No** | Sending dose alerts |
| User ID | Supabase auth UUID | Supabase + session token (device keystore) | **Yes** | **No** | Authentication / data ownership |
| Reminder preferences | `profiles.notify_push/email/alarm` | Supabase + cache | **Yes** | **No** | App settings |

## Data sent to third parties (sub-processors)

| Service | What it receives | Why |
|---|---|---|
| **Supabase** (database + auth host) | All of the above | Backend storage + authentication |
| **Resend** (email, via the `notify-caregiver` Edge Function) | Caregiver email address, patient's display name, medication name, late/missed status | Delivers caregiver dose alerts (only when the Email reminder channel is on) |

No data is sold. No data is shared for advertising. No cross-app/cross-site tracking.

## Security

- **In transit:** HTTPS/TLS to Supabase and Resend.
- **At rest (cloud):** Supabase-managed Postgres; access restricted by Row-Level Security (each user can only read/write their own rows).
- **At rest (device):** session tokens and the cached health data are AES-256 encrypted; the key is held in the iOS Keychain / Android Keystore (`lib/secureStorage.ts`).

## ── Apple "App Privacy" mapping ──
Declare **Data Linked to You** (not used for tracking):
- **Health & Fitness → Health** (medications, adherence logs)
- **Contact Info → Name**
- **Contact Info → Email Address** (caregiver/family contacts the user enters)
- **Identifiers → User ID**
Tracking: **No**. Data used to track you: **None**.

## ── Google Play "Data Safety" mapping ──
- **Personal info → Name** — collected, encrypted in transit, not shared, required.
- **Personal info → Email addresses** — collected (caregiver contacts), encrypted in transit, not shared.
- **Health and fitness → Health info** — collected, encrypted in transit, not shared.
- **App info and performance** — none. **Location** — none. **Financial** — none.
- Data **encrypted in transit:** Yes. **Users can request deletion:** Yes (see account-deletion blocker below).

## ✅ In-app account deletion — IMPLEMENTED
Settings → **Delete Account** (two-step confirmation) permanently removes the
account and all data. In cloud mode this calls the `delete-account` Edge Function
(deletes the Supabase auth user; rows cascade). **You must deploy that function**
before submitting: `supabase functions deploy delete-account` (see SUPABASE_SETUP.md).
