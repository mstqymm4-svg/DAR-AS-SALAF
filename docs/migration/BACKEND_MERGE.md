# Backend consolidation record (Phase 2)

## Starting state (verified)
- `backend/src/app.ts` imported 12 route groups; only `auth` and `health` existed in `backend/src/routes/`.
- The other 24 files (10 routes, 3 controllers, 7 validators, `crud.ts`, `favorite.service.ts`, `multer.ts`, `migrateFromBase44.ts`) lived in `src/backend/src/` — inside the frontend tree.
- `package.json` scripts referenced a missing `prisma/seed.ts`; no Prisma migrations; Dockerfile copied a non-existent `public/` dir.

## Decisions
| Decision | Reason |
|---|---|
| `git mv src/backend/src/* backend/src/*` (history preserved) | No filename overlapped between the two halves (checked file-by-file), so no content was discarded or overwritten. Removes server code from the Vite source tree. |
| Removed `seed` script | File never existed. Admin creation uses `npm run create-admin`. |
| Added `prisma/migrations/20261014121514_init` | First versioned migration from the existing schema (unchanged). Schema additions are Phase 3. |
| `migrateFromBase44.ts` kept, minimal type fix only | Will be rewritten in Phase 6 (idempotent, dry-run, Base44-ID column). |
| Removed `COPY public` from Dockerfile | Directory does not exist; build would fail. |

## Security defects found and fixed
1. **Drafts/hidden items were public.** `GET /api/books` (and `?status=draft`), `/api/books/:id`, videos, video channels and social channels returned unpublished/hidden rows to anyone. Fix: `optionalAuth` middleware + `publicWhere` in `crud.ts`; non-admins always get `status=published` / `visible=true`.
2. **Privilege escalation.** Any ADMIN could set any user's role (incl. their own) to SUPER_ADMIN. Fix: only SUPER_ADMIN may change roles; role value validated; admins cannot deactivate themselves.
3. **Upload errors returned 500.** Rejected type → 415, size limit → 413.
4. **Weak secrets in production.** Startup now fails if JWT secrets are < 32 chars or identical when `NODE_ENV=production`.

## Verification (local, throwaway PostgreSQL 15)
- `npm run typecheck` — 0 errors
- `npm run build` — OK; `node dist/server.js` starts; `GET /api/health` → `{"database":"ok"}`
- `npm test` — 21/21 pass: health, register/login/duplicate, refresh rotation + reuse rejection + logout revocation, role matrix (anon 401 / USER 403 / ADMIN 2xx) on create/update/delete for books, categories, authors, videos, video-channels, social-channels; draft/hidden non-leak; favorites per-user idempotency; settings; users admin (no hashes, no escalation, SUPER_ADMIN-only delete); uploads (403 USER, 415 bad type, 201 PDF, delete); 404 JSON.

## Run locally
```bash
cd backend && npm install && cp .env.example .env   # fill DATABASE_URL + secrets
npx prisma migrate deploy && npm run create-admin -- you@example.com 'StrongPass' "Name"
npm run dev            # http://localhost:5000/api/health
TEST_DATABASE_URL=postgresql://...throwaway... npm test   # tests RESET that database
```

## Known gaps (Phase 3 scope, not yet done)
AccountData + ReadingProgress models; publication state/trash on all content; YouTube fields; file checksums/R2 driver; activity log; email verification, password reset, account deletion, login lockout; translation routes; Base44-ID columns.
