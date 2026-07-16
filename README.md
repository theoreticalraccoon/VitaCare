# VitaCare

A medication-adherence app for elderly patients and people with chronic
illness, built with **React Native + Expo** for the **Google Play Store**.

Unlike reminder-only apps, VitaCare's novelty is **human confirmation +
caregiver accountability**: every dose is confirmed with a timestamp, and
late/missed doses trigger an **escalation chain** (patient → primary caregiver →
secondary family contact).

> Team Rajadhe — IIT Inter-School Hackathon 2026.

## Design principles applied

| Principle | In VitaCare |
|---|---|
| **Core function** | Confirm each medication dose so caregivers can verify adherence. |
| **Core loop (<30s)** | Open app → see the dose that's due → tap **Confirm Dose** → progress ring + streak update, late doses log an alert + "caregiver notified". One tap. |
| **Surface area (5–7 screens)** | Sign In · Sign Up · Onboarding · Home · Records · Settings = **6 screens**. |
| **Accessory features** | Adherence timeline & alerts, medication editor, caregiver contacts, reminder channels. |
| **Retention hook** | Daily progress ring + adherence **streak** ("🔥 5-day streak"), reinforced by real caregiver accountability. |

Accessibility for elderly users: large 56px touch targets, large type, calm
green & cream palette, and color-coded dose states (green = taken, amber =
late/due, red = missed).

## Tech stack

- Expo SDK 56 · React Native 0.85 · TypeScript (strict)
- **Expo Router** — file-based navigation with an auth/onboarding/tabs gate
- **AsyncStorage** — local persistence (medications, dose logs, profile, settings)
- **expo-notifications** — real local dose reminders
- **react-native-svg** — progress ring & logo
- **EAS Build** — produces the Android App Bundle (`.aab`) for Play Store

## Project structure

```
VitaCare/
├── app/                      # Routes (Expo Router)
│   ├── _layout.tsx           # Root: AppProvider + stack
│   ├── index.tsx             # Gate → auth / onboarding / tabs
│   ├── (auth)/               # signin, signup
│   ├── onboarding.tsx        # First-run: pills + contacts + channels
│   └── (tabs)/               # Home · Record · Settings(Edit)
├── components/               # Logo, ProgressRing, DoseCard, Timeline, etc.
├── store/                    # AppContext (state + persistence) + seed data
├── lib/                      # adherence, escalation, records, time, notifications
├── constants/                # Colors (green/cream), Layout tokens
├── types/                    # Domain types
├── app.json                  # Expo config (Android pkg: com.vitacare.app)
└── eas.json                  # EAS Build / Submit profiles
```

## How it works

- **State** lives in [store/AppContext.tsx](store/AppContext.tsx) and persists to
  AsyncStorage on every change, so the schedule, confirmations and streak
  survive restarts.
- **Today's doses** are derived live from the medication schedule
  ([lib/adherence.ts](lib/adherence.ts)); today's overdue doses stay confirmable
  so the loop is always available, while past-day misses are recorded.
- **Confirming a dose** computes lateness and the escalation chain, then the
  Records timeline ([lib/records.ts](lib/records.ts)) renders human-readable
  alerts ("Lisinopril was taken at 12:35 PM, 30 minutes late. Primary caregiver
  notified.").
- The app **seeds 3 days of history** on first launch so Records, adherence rate
  and streak have content to demo.

## Running locally

```bash
npm install
npm run android      # device/emulator via Expo Go
npm start            # dev server — scan the QR with Expo Go
```

First run flow: **Sign Up** (or Sign In) → **Onboarding** (the schedule is
pre-filled with Metformin / Lisinopril / Amlodipine — edit freely) → **Home**.

## Building for the Play Store

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production   # produces a .aab
eas submit --platform android
```

A [Google Play Developer account](https://play.google.com/console/signup) is
required to publish.
