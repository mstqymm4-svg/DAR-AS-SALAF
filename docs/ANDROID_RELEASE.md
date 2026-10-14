# Dar-ul-Uloom: Android release guide (Google Play)

## Why Play rejected the old AAB (diagnosed 2026-10-14)
| | Old Base44 AAB (`android-2.131675.1.aab`) | Play Console expects |
|---|---|---|
| Package name | `com.base69c8e483a69a0d215eee4ef7.app` | **`com.darululoom.app`** |
| Signed by | "Wix One" certificate (Base44/Wix), SHA-256 `B7:5B:33:41:01:46:16:F1:A3:66:E0:82:60:81:F4:5C:C9:6C:22:08:B6:F7:51:80:A5:30:01:C1:3B:57:1A:1A` | your upload key |
| Version | code 1 / name 2.131675.0, target SDK 36, min SDK 26 | — |
| Build | Generic Base44/Wix React Native shell, 197 MB (Stripe, Facebook, photo editor, banking-app queries) | — |

Root cause: **the package name does not match**. A package name cannot be changed inside an existing AAB, and this one is signed with Base44/Wix's key. So a new AAB has to be built.

## New build (this repo, branch `independent-migration`)
- Capacitor 8 wrapping the existing React/Vite app. **All app files are bundled inside the AAB**; it is not a website shortcut.
- `applicationId com.darululoom.app`, versionCode 2, versionName 2.0.0, targetSdk 36, minSdk 24. Only the INTERNET permission. 5.5 MB.
- It still uses your live Base44 data (books, videos, channels, settings), the same as the website.
- Icon and splash come from your existing logo, on the brand green `#0d3b2e`.
- Hardware back button goes back a page and only exits from the first screen. The service worker is skipped in the app, and offline books stay in IndexedDB.
- Website behaviour is unchanged. The only website-side code edits are a Base44 server URL setting that falls back to the old value, and the native-only checks in `main.jsx`.

## Build and sign on your laptop (Android Studio)
1. `git clone` the repository, then `git checkout independent-migration`.
2. `npm install`, then `npm run build:android`. This builds the web app in Android mode and copies it into `android/`.
3. Open the `android/` folder in Android Studio and wait for Gradle sync.
4. **Build → Generate Signed App Bundle / APK → Android App Bundle**.
   - **Existing keystore:** use it if you uploaded a `com.darululoom.app` bundle before. See the signing check below.
   - **Create new:** do this only if Play has never accepted a bundle for this app. Back up the `.jks` file and its passwords; never commit them.
5. Choose the `release` variant. The output is `android/app/release/app-release.aab`.

## Signing check before uploading
Open Play Console → your app → **Test and release → App integrity → App signing**.
- **An upload key certificate is shown:** your AAB must be signed with that key. Compare its SHA-256 with `keytool -list -v -keystore your.jks`. If you lost the key, use **Request upload key reset** on the same page.
- **Nothing is set up yet:** the first upload registers your key, and Play App Signing manages the final signing key.

## Upload
Play Console → **Test and release → Testing → Internal testing → Create new release → Upload** the signed `app-release.aab`. Then Next → Save → **Start rollout to Internal testing**. Add your own email as a tester and install from the opt-in link.
If Play says the version code has already been used, raise `versionCode` in `android/app/build.gradle` and rebuild.

## Still needed before Production
- **In-app sign-in:** set `VITE_BASE44_APP_BASE_URL` in `.env.android` to your Base44 app URL (Base44 dashboard → app URL). Reading and browsing work without it.
- Google sign-in will not work inside the app's built-in browser, because Google blocks it there. Email sign-in through Base44 is expected to work.
- **Play Console forms:**
  - privacy policy URL, Data safety, content rating and target audience
  - account deletion: the app's Settings already has an account-deletion request, but you also need a web link to a deletion page
  - a reviewer login if the app needs one
- **Personal developer accounts created after Nov 2023:** a closed test with 12 testers for 14 days is required before Production.
- Test on a real phone: opening a PDF, saving offline (airplane mode), favourites, YouTube playback, RTL and the back button.
