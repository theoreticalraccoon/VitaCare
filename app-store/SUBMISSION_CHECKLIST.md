# VitaCare — Submission Runbook

What's already done vs. what **you** must do (accounts, payments, and
interactive CLI/console steps can't be automated from here).

Legend: ✅ done · 🟡 your action · ⛔ blocker to fix first

---

## ✅ Account deletion — DONE (just deploy the function)
In-app account deletion is now implemented (Settings → **Delete Account**, two-step
confirm). For it to work in production you must **deploy the Edge Function** once:
```bash
supabase functions deploy delete-account
```
(Local/offline mode deletes the on-device account directly — no function needed.)

Also recommended before store review:
- Delete the leftover test users `diag_check` / `e2e_check` in Supabase Auth.
- Create a real **review demo account** (e.g. username `appreview`) and put its
  password into `app-store/LISTING.md` → App Review Notes.

---

## Phase 1 — Test on a real device 🟡
- Build a dev client: `eas build --platform ios --profile development` (or Android),
  install via the Expo dashboard QR.
- Walk every flow: sign up → onboarding → add meds → confirm dose → history →
  edit/delete med → sign out → sign back in (data persists) → bad inputs → no network.
- Fix anything that breaks. (Paste any error here and I'll diagnose.)

## Phase 2 — Production config ✅ (done last turn)
- `app.json`: bundle IDs, `ITSAppUsesNonExemptEncryption:false`, valid permissions,
  icon 1024×1024 no-alpha verified, splash via plugin. 
- `eas.json`: created, `autoIncrement:true` on production, iOS+Android submit blocks.
- `.gitignore`: `.env` and service-account keys ignored.
- **Listing copy + privacy/support/terms + data-safety map**: in this `app-store/` folder.

## Phase 3 — Build for production 🟡
```bash
npm install -g eas-cli
eas login                 # your Expo account
eas init                  # one-time: creates the EAS project, writes projectId to app.json
eas build --platform ios --profile production       # prompts for Apple login on first run
eas build --platform android --profile production   # produces .aab; auto-creates a keystore
```
⚠️ **Back up the Android keystore immediately** after the first Android build:
```bash
eas credentials        # download/save the keystore somewhere safe
```
If you lose it you can never update the Android app (Google can reset the *upload* key,
but back it up anyway). Confirm each build shows **Finished** at expo.dev.

## Phase 4 — Apple Developer account 🟡
- Enroll: https://developer.apple.com — **$99/year**, 24–48 h identity check.
- In App Store Connect, accept the latest agreements; add tax/banking only if charging.

## Phase 5 — Create the App Store listing 🟡
1. App Store Connect → **My Apps → + → New App**. Platform iOS, Name from
   `LISTING.md` (App Name), language, Bundle ID `com.vitacare.app`, SKU `vitacare-v1`.
2. Paste fields from **`app-store/LISTING.md`** (promo text, description, keywords,
   copyright, review notes).
3. Fill `eas.json` → `submit.production.ios`: `appleId` (your Apple ID email),
   `ascAppId` (the numeric ID from the new app's URL / App Information),
   `appleTeamId` (Apple Developer → Membership).
4. **Screenshots** (you create these on a real device/simulator):
   - iPhone 6.5″: 1242×2688 or 1284×2778 (required)
   - iPad 13″: 2048×2732 (required — your app has `supportsTablet:true`)
   - 3–10 each; most compelling first.
5. Privacy Policy URL + Support URL: host `privacy-policy.html` and `support.html`
   at public HTTPS URLs and paste them in.

## Phase 6 — App Privacy & ratings 🟡
- **App Privacy:** use `app-store/data-collection.md` → "Apple App Privacy mapping".
  (Health, Name, Email, User ID — all *Linked, not Tracking*.)
- **Age rating:** questionnaire → likely 4+ (no objectionable content).
- **Content rights:** original content → No.

## Phase 7 — Submit iOS 🟡
```bash
eas submit --platform ios --latest    # connects to App Store Connect, uploads the build
```
Wait 15–30 min for processing → attach the build on the version page → **Add for
Review → Submit to App Review**.

## Phase 8 — Review 🟡
24–48 h typical. If rejected, paste Apple's message here and I'll translate the
guideline and tell you the fix. Most common: missing test creds, privacy mismatch,
or a crash — all avoidable with Phase 1 + the demo account.

---

# ══════════ GOOGLE PLAY ══════════

## A.1 Account 🟡
https://play.google.com/console — **$25 one-time**, identity verification (have ID ready).

## A.2 Build ✅ command ready / 🟡 you run it
`eas build --platform android --profile production` → `.aab`. Back up the keystore (above).

## A.3–A.4 Create app + setup 🟡
- Play Console → **Create app** (name, language, App, Free).
- Store listing: title/short/full description + release notes from `LISTING.md`;
  feature graphic **1024×500** (required), icon **512×512**, 2–8 phone screenshots.
- Content rating (IARC), Target audience (pick 18+ unless built for kids → avoids
  COPPA), **Data safety** from `data-collection.md` → "Google Play Data Safety mapping",
  category (Medical or Health & Fitness), contact details, and the **Privacy Policy URL**.

## A.5 Google Play service-account key (for `eas submit`) 🟡
This is the fiddly one. Do it once:
1. **Play Console → Setup → API access.** If prompted, link or create a Google Cloud
   project, then click into "Service accounts → Create service account" (opens Google
   Cloud Console).
2. **Google Cloud Console → IAM & Admin → Service Accounts → Create service account.**
   Name it e.g. `eas-publisher`. Skip optional role grants here → **Done**.
3. Open the new service account → **Keys → Add key → Create new key → JSON → Create.**
   A `.json` downloads — save it to the project root as **`google-service-account.json`**
   (already git-ignored).
4. Back in **Play Console → Users and permissions → Invite new user**, invite that
   service account's email (`...@...iam.gserviceaccount.com`). Grant at least:
   **Release → Release to production / testing tracks** and **View app information**
   (or simply "Admin (all permissions)" for one app). Save.
5. The path in `eas.json` (`./google-service-account.json`) now works.

## A.6–A.7 Submit + release 🟡
```bash
eas submit --platform android --latest    # asks for the JSON path on first run
```
Play Console → your app → **Production → Create new release** → the uploaded `.aab`
appears → add release notes → **Review release → Start rollout to Production**.
(Tip: do an **Internal testing** track release first to smoke-test the store build.)

## A.8 Review 🟡
1–3 days first time (up to 7 for brand-new accounts); updates often same-day.

---

## Files I generated for you (in `app-store/`)
| File | Use |
|---|---|
| `LISTING.md` | All App Store + Play text fields, keywords, review notes |
| `privacy-policy.html` | Host publicly; paste URL in both consoles |
| `support.html` | Host publicly; App Store Support URL |
| `terms-of-service.html` | Host publicly (optional but recommended) |
| `data-collection.md` | Fill Apple App Privacy + Google Data Safety accurately |
| `SUBMISSION_CHECKLIST.md` | This runbook |

> Legal docs are templates, not legal advice. Replace placeholders (company/legal
> entity, contact email, hosted URLs) and have them reviewed if your situation warrants.
