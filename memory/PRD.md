# Dar-ul-Uloom — Independent Migration (PRD / status)

Original problem: Remove Base44 runtime dependency from the existing React/Vite Dar-ul-Uloom library (repo DAR-AS-SALAF), keep the UI/RTL and all features, use an owner-controlled Express/Prisma/PostgreSQL backend + R2 storage, admin CMS, YouTube auto-sync, and a Capacitor Android release for Google Play. Full plan: `/app/plan/plan.md` (3 stages, 7 phases).

## Status (2026-10-14)
- Phase 1 (partial): tag `pre-migration-snapshot`, verified bundle `/app/backups/pre-migration-snapshot.bundle`, branch `independent-migration` (main untouched, no remote push). Base44 inventory: `docs/migration/BASE44_INVENTORY.md`. AAB diagnosis BLOCKED on artifacts (`docs/migration/AAB_REPORT.md`).
- Phase 2 DONE: backend merged into `backend/` (history kept), init migration, env checks, Dockerfile fix, 2 security fixes (draft leak, role escalation), 21/21 tests on throwaway local PostgreSQL. Record: `docs/migration/BACKEND_MERGE.md`.
- Frontend baseline: `vite build` succeeds (still Base44-dependent at runtime).

- 2026-10-14 Android: Play error diagnosed (package mismatch, Base44 AAB = com.base69c8e483a69a0d215eee4ef7.app, Wix One signed). Capacitor 8 project added (android/), com.darululoom.app, vc2, target 36, bundled assets, back button, local icons. Unsigned AAB built OK (5.5 MB) → /app/backups/app-release-unsigned-v2.aab. Guide: docs/ANDROID_RELEASE.md. User priority now: Play release only, keep Base44.

- 2026-10-14 User: no sign-in needed (Base44 public_without_login confirmed). Play app signing key SHA-256 = Wix One cert (B7:5B…1A:1A), so the upload key is probably Wix/Base44's. Android build has Base44 analytics disabled; AAB rebuilt (vc2, target 36). Play docs: docs/play/PRIVACY_POLICY.md, PLAY_CONSOLE_ANSWERS.md. Content still served by Base44 (moving it needs hosting approval).

## Next
- P0 Phase 3: AccountData, ReadingProgress, publication state/trash, YouTube/video-source fields, file metadata + R2 driver, activity log, email verify/reset/account deletion, lockout, Base44-ID columns.
- P0 AAB diagnosis once artifacts provided.
- Stage 2 (needs approval + accounts): CMS, YouTube sync, staging, frontend migration.
- Stage 3 (needs approval): data/media migration, cutover, Android/Play.
- Deferred: donations/PayPal.
