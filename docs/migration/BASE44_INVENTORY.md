# Base44 dependency inventory (verified 2026-10-14, branch `independent-migration`)

Source: `grep` over `src/`, `public/`, `index.html`, `vite.config.js`, `base44/`.
Every item must have a verified replacement before the Base44 code is removed (Phase 5).

## 1. Build / hosting level
| Item | Location | Replacement (Phase) |
|---|---|---|
| `@base44/vite-plugin` (analytics tracker, visual-edit agent, legacy `@/entities` aliases) | `vite.config.js` | Remove plugin after imports migrated (5) |
| `@base44/sdk` client | `src/api/base44Client.js`, `src/lib/app-params.js` | `src/lib/api/*` client for independent API (5) |
| App icons / favicon / splash preload on `media.base44.com` | `public/manifest.json` (3 icons), `index.html` lines 5,6,9 | Download, bundle into `public/icons/` (5/6) |
| Uploaded media URLs (covers, PDFs, logos, backgrounds) stored in records/settings | Live DB only | Media migration to R2 (6) |

## 2. Authentication (`base44.auth.*`)
| Call | Files |
|---|---|
| `auth.me` (15) | App, Layout, ProfileCard, AuthContext, accountSync, contentSyncEngine, offlineSync, PageNotFound, Favorites, Home, Settings, Books, Videos, BookDetails, DevTesting |
| `auth.logout` (3) | AuthContext (2), Settings |
| `auth.updateMe` (2) | ProfileCard, Settings |
| `auth.redirectToLogin` | AuthContext (hosted Base44 login page) |
| `auth.isAuthenticated` | OAuthConsent |
Replacement: `/api/auth/{register,login,refresh,logout,me}` (exists, tested) + new email verification, password reset, account deletion (3). New login/register/reset screens reuse `AuthLayout` (5).

## 3. Entities (`base44.entities.*`)
| Entity | Calls | Files | Backend status |
|---|---|---|---|
| Book | list/create/update/delete (18) | Admin, DevBooks, DevBackup, DevDashboard, DevMaintenance, DevStorage, DevTesting | `/api/books` ✅ |
| Video | list/create/update/delete (9) | DevVideos, DevDashboard, DevMaintenance, DevTesting | `/api/videos` ✅ (needs source/YouTube fields, 3) |
| VideoChannel | (9) | DevVideos, DevDashboard, DevMaintenance, DevTesting | `/api/video-channels` ✅ (needs YouTube sync fields, 3/4) |
| SocialChannel | (7) | DevSocialChannels | `/api/social-channels` ✅ |
| Favorite | list/delete (5) | DevMaintenance, DevDashboard, DevTesting | `/api/favorites` ✅ (per-user) |
| User | list/update/delete (4) | DevUsers, DevDashboard | `/api/users` ✅ |
| AccountData | filter/create/update (4) | accountSync | ❌ model missing (3) |
| AppSettings | list (3) | DevPerformance, DevLogs, DevTesting (+ settingsStore) | `/api/settings` ✅ |
| BookTranslation, Translation, TranslationGlossary, TranslationLanguage | not called from `src/` directly | — | Prisma models exist, no routes yet (3) |

## 4. Integrations
| Call | Files | Replacement |
|---|---|---|
| `Core.UploadFile` (7) | Admin, DevBooks, DevVideos, DevSocialChannels, DevFonts, DevBackgroundManager, ProfileCard | `/api/uploads` (local, tested) → R2 presigned (3) |
| `Core.UploadPublicFile` | uploadFacade | same |
| `Core.SendEmail` | EmailVerification | Resend via backend email service (3) |
| `Core.InvokeLLM` | AISearch | Server-side Arabic-normalised full-text search (5) |

## 5. Server functions (`base44/functions/*`, `functions.invoke`)
| Function | Called from | Replacement |
|---|---|---|
| `fetchVideoMeta` | DevVideos | YouTube Data API service (4) |
| `sendContactMessage` | Contact | `/api/contact` + email service (3) |
| `deleteAccountRequest` | Settings | `/api/account` DELETE + web deletion page (3/7) |
| `sendRegistrationVerification`, workflow "New User Verification Email" | Base44 workflow | `/api/auth/verify-email` (3) |
| `gmailNotify` + `connectors/gmail.jsonc` | Base44 connector | Resend admin notifications (3) |

## 6. Already-present abstraction
`src/lib/dataSource.js` maps 8 entities to the new API behind `VITE_USE_INDEPENDENT_API` (default off). Most pages bypass it and call `base44` directly — Phase 5 routes them through it.
