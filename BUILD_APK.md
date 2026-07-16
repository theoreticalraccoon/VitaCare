# Build VitaCare as a sideloadable Android APK

This produces a **signed, standalone `.apk`** you install directly on any Android
phone — no Google Play, no Mac, no Android Studio on your PC. The build runs in
Expo's cloud (EAS); you just download the result.

> Unlike Expo Go, this real build runs **notifications, alarms, and the
> notification icon** — and connects to your Supabase database (the public keys
> are baked into the `preview` profile in `eas.json`).

## One-time setup

```bash
npm install -g eas-cli      # the EAS command-line tool
eas login                   # sign in (free Expo account — create one if needed)
eas init                    # links this project to EAS (writes projectId to app.json)
```

## Build the APK

```bash
eas build --platform android --profile preview
```

What happens:
- On the **first** Android build, EAS generates and stores a signing keystore for
  you. **Back it up** afterwards: `eas credentials` → Android → download. (You only
  need this if you later want to update an installed app without users uninstalling.)
- The build runs in the cloud (~10–20 min, depending on the free-tier queue).
- When it finishes you get a URL (also shown at https://expo.dev → your project →
  Builds) with a **Download** button and a QR code for the `.apk`.

## Install it on your phone (sideload)

Pick whichever is easiest:

**A. Straight from the phone**
1. Open the build's page on your phone (scan the QR from the EAS output or the
   Expo dashboard) and tap **Install / Download .apk**.
2. Android will warn "install unknown apps" — allow it for your browser/Files app
   (Settings → Apps → [the app] → Install unknown apps → Allow).
3. Tap the downloaded `vitacare.apk` → **Install** → **Open**.

**B. From your PC over USB**
1. Download the `.apk` from the build URL to your computer.
2. Copy it to the phone (USB/Drive), open it with the Files app, and install
   (allow "unknown apps" if prompted).

That's it — VitaCare is now installed like any normal app, launches on its own
(no Metro/computer needed), syncs to Supabase, and runs reminders.

## Sharing it with others
Send anyone the `.apk` (or the build link). They allow "unknown apps" once and
install. Each install is the same signed build.

## Updating later
Make your changes, then rebuild:
```bash
eas build --platform android --profile preview
```
Install the new `.apk` over the old one (same signing keystore = installs as an
update, keeps data). If you ever see a "signatures do not match" error, it means a
different keystore was used — reinstall after uninstalling, and keep using the
keystore EAS created on your first build.

## Troubleshooting
- **"App not installed" / parse error:** the download was incomplete or the phone
  is very old (minSdk). Re-download; ensure Android 7+.
- **App opens but says "Offline":** the build didn't get the Supabase env. Confirm
  the `preview` profile in `eas.json` still has the `EXPO_PUBLIC_SUPABASE_*` values.
- **Build fails:** paste the EAS error here and I'll diagnose it.
