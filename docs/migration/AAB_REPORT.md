# Android AAB / Play Console diagnosis — PENDING ARTIFACTS

Status: **blocked — no AAB, Play error, or laptop Android project has been provided to this workspace yet.**
Repository check: no `android/`, no `capacitor.config.*`, no `twa-manifest.json` → the existing AAB was **not** built from this repository as-is.

## To be filled once artifacts are provided
| Field | Value | How determined |
|---|---|---|
| Package / application ID | ? (intended: `com.darululoom.app`) | `bundletool dump manifest` |
| versionCode / versionName | ? | manifest |
| minSdk / targetSdk | ? (Play requires target ≥ 35 now; ≥ 36 after 31 Aug 2026) | manifest |
| Signing cert SHA-256 | ? | `keytool -printcert -jarfile app.aab` (no keystore needed) |
| Build tool | ? Capacitor / TWA (Bubblewrap/PWABuilder) / other | presence of `capacitor.config.json`, `assetlinks`, `com.google.androidbrowserhelper` |
| Bundled assets or remote URL | ? | `base/assets/public/index.html` vs launcher URL |
| Matches current commit? | ? | hash compare of bundled JS vs `vite build` output |
| Exact Play Console error | ? | from you |

## Known causes to check against
Package name already used/reserved · targetSdk too low · debug-signed · wrong upload key · reused versionCode · missing policy/declarations · new personal account closed-test rule (12 testers / 14 days).
