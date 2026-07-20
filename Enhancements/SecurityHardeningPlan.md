# Security Hardening Plan

Origin: blue-team review of the application (see review findings summarised
below). Work proceeds in phases, each on its own `feature/*` branch, rolling
out through the pipeline defined in `docs/PRODUCTION_ROLLOUT.md`.

## Step 0 — Branch strategy + formalised production rollout (this phase)

**Status: implemented on `feature/security-hardening`.**

- Branch model: `feature/*` → `develop` (staging) → `main` (production).
- CI quality gates (`.github/workflows/ci.yml`): typecheck, lint, build on
  every PR to `develop`/`main` and every push to `develop`.
- Rollout process, staging setup, smoke-test checklist, promotion and rollback:
  `docs/PRODUCTION_ROLLOUT.md`.

**Remaining manual steps (owner: project admin):**

1. GitHub: add branch protection on `main` and `develop` (require PR + CI
   green) — click-path in `docs/PRODUCTION_ROLLOUT.md`.
2. Firebase console: create the `myponyclubapp-events-staging` App Hosting
   backend linked to `develop`, with `RESEND_API_KEY` and a new strong
   `JWT_SECRET` attached — click-path in `docs/PRODUCTION_ROLLOUT.md`.

---

## Phase 1 — Enforce authentication/authorization on all API routes

**Why:** only 15 of 118 API route files use an auth helper. Destructive
endpoints are open today: `api/admin/purge-database` (wipes zones/clubs),
`api/admin/users/delete-all`, `api/admin/backup-cron` (contains a literal
`TODO: Add authentication check`), plus ~40 admin backup/export/import/seed
routes.

**Scope:**

1. Build a route inventory: all 118 routes classified public / authenticated /
   role-gated, each mapped to its client caller and whether the caller sends a
   token. User reviews and signs off the classification before any edit.
2. Fix client-side gaps where tokens are not attached to requests.
3. Enforce in small batches using the existing `src/lib/api-auth.ts` helpers —
   batch 1 is the destructive admin routes (`requireSuperUser`).
4. `embed/calendar`, `health`, `auth`, and public event-request endpoints stay
   public by design.

**Verification:** typecheck + build green; manual staging smoke test; direct
unauthenticated `curl` against each newly gated route returns 401.

## Phase 2 — JWT secret handling (then evaluate Firebase Auth)

**Why:** the JWT secret falls back to a hardcoded default in 5 files
(`src/app/api/auth/route.ts`, `src/app/api/auth/refresh/route.ts`,
`src/lib/api-auth.ts`, `src/lib/auth-helpers.ts`,
`functions/src/api/auth/index.ts`), and `apphosting.yaml` does not provision
`JWT_SECRET`. If unset in the hosting environment, admin tokens are forgeable.
Login is ponyClubId + mobile number with no rate limiting.

**Scope:**

1. Provision a strong `JWT_SECRET` in Secret Manager for both backends (part of
   the Step-0 console checklist).
2. Dual-verify transition: accept tokens signed with the old value and the new
   secret for one token lifetime (24h), then remove the fallback and fail fast
   at startup if `JWT_SECRET` is unset.
3. Add rate limiting on `POST /api/auth`.
4. Follow-up evaluation: migrate to Firebase Auth ID tokens
   (`verifyIdToken`) for managed rotation/revocation.

**Verification:** staging login works across the secret cutover (no forced
logout mid-transition); requests with tokens signed by the old default are
rejected after cutover.

## Phase 3 — Firestore and Storage security rules

**Why:** no `*.rules` file exists in the repo and `firebase.json` has no
`firestore`/`storage` sections — rules are either absent or unmanaged in the
console. The API layer is currently the only access control, and Phase 1 shows
how thin that layer is.

**Scope:** write `firestore.rules` and `storage.rules` (default-deny, then
per-collection allowances matching the data model in `src/lib/types.ts`), wire
them into `firebase.json`, and test against the emulator before deploy.

**Verification:** emulator rule tests for the key allow/deny paths; staging
smoke test after deploy.

## Phase 4 — Cloud Functions hardening

**Why:** no function checks caller authorization (zero `verifyIdToken`/`Bearer`
checks in `functions/src`), backup triggers run with `cors: true`, and
duplicate debug variants (`apiSimple`, `testSimple`, `backup-simple`,
`backup-fixed`) are deployed to production.

**Scope:** require an authenticated invoker (OIDC for scheduler, verified user
token for manual triggers), restrict CORS to the app origin, delete the
simple/fixed debug variants, keep one canonical backup implementation.

**Verification:** unauthenticated calls to trigger endpoints fail; scheduled
backups still run on staging.

## Phase 5 — Ratchet CI and test coverage

**Why:** no CI existed before Step 0; there are no unit tests under `src`
(the `test:*` npm scripts are manual HTTP scripts against a running server);
276 `: any` occurrences; ~20 one-off debug scripts clutter the repo root.

**Scope:** make lint a blocking gate once existing errors are cleaned; add
unit tests for `api-auth.ts` helpers and the validation layer; add API
contract tests for the highest-risk routes; consolidate or archive root-level
one-off scripts.

**Verification:** CI blocking on lint; unit tests run in the CI workflow.

---

## Working agreement for all phases

- One phase (or batch) per `feature/*` branch; PR to `develop`; staging smoke
  test; promote via `develop` → `main` per `docs/PRODUCTION_ROLLOUT.md`.
- No phase changes the data model or deletes data.
- Rollback for every phase is `git revert` + redeploy.
