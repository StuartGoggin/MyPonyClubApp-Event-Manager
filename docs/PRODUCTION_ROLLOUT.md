# Production Rollout Process

This document defines how code travels from a developer's machine to the live
MyPonyClub Event Manager app. It exists so that no change reaches production
without automated checks and a pre-production verification step.

## Branch model

```
feature/*  ──PR──▶  develop  ──PR──▶  main
                     │                  │
                     ▼                  ▼
              staging backend     production backend
        (myponyclubapp-events-    (myponyclubapp-events)
              staging)
```

- **`main`** — production only. The existing App Hosting backend
  (`myponyclubapp-events`) deploys from this branch. Nothing is pushed or
  merged here except via a promotion PR from `develop`.
- **`develop`** — staging integration. The staging App Hosting backend deploys
  from this branch automatically on every push/merge.
- **`feature/*`** — all work happens here, branched off `develop`. Merged back
  via PR only.

## Rules

1. Every change enters via a pull request — no direct pushes to `develop` or
   `main`.
2. The **CI** workflow (`.github/workflows/ci.yml`) must be green before merge:
   `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`.
3. A feature PR merges into `develop` → staging deploys automatically → run the
   smoke-test checklist below.
4. When staging is verified, open a promotion PR `develop` → `main`, merge,
   tag the release, and run post-deploy verification on production.
5. Secrets live in Cloud Secret Manager / local `.env.local` only — never in
   the repository. The hardcoded JWT fallback must never be used in any
   deployed environment (see `Enhancements/SecurityHardeningPlan.md`, Phase 2).

## One-time setup (manual, console steps)

### GitHub — branch protection

1. Repo → **Settings → Branches → Add branch ruleset** (or "Add rule").
2. For `main`: require a pull request before merging, require status check
   `Typecheck, lint and build` to pass, block force pushes.
3. Repeat for `develop` (PR + CI required; review optional for solo work).

### Firebase — staging backend

1. Firebase console → **App Hosting → Create backend**.
2. Name: `myponyclubapp-events-staging`; connect the same GitHub repo; set the
   branch to **`develop`**; same region as production; root directory `/`.
3. In the staging backend's environment, attach secrets:
   - `RESEND_API_KEY` (existing secret).
   - `JWT_SECRET` — create a **new, strong** secret in Secret Manager and grant
     it to the staging backend. Do the same for the production backend. Never
     rely on the `your-super-secret-jwt-key-change-in-production` fallback in
     the code.
4. Confirm the first staging deploy succeeds, then add the staging URL to your
   bookmarks for smoke testing.

## Staging smoke-test checklist

Run after every merge to `develop`, before promoting to `main`:

- [ ] Log in with a real club account (validates JWT issuance).
- [ ] Admin dashboard loads (users, zones, clubs lists render).
- [ ] Event calendar loads and an event detail page opens.
- [ ] One admin export or report runs successfully.
- [ ] One email-queue action completes (or is correctly rejected).
- [ ] Log out and confirm protected pages redirect to login.

## Production promotion

1. Open PR `develop` → `main`; confirm CI is green.
2. Merge during a low-usage window.
3. Tag the release: `git tag vX.Y.Z main && git push origin vX.Y.Z`
   (increment from `version` in `package.json`; note highlights in
   `CHANGELOG.md`).
4. Watch the App Hosting rollout complete, then re-run the smoke-test
   checklist against the production URL.

## Rollback

- **Code rollback (preferred):** `git revert <merge-commit>` on `main`, push —
  App Hosting redeploys the previous code within minutes.
- **Platform rollback:** Firebase console → App Hosting → backend → roll back
  to the previous rollout. Use this when the bad deploy breaks the build or
  the revert itself can't deploy.
- **Data note:** neither rollback undoes data changes. Scheduled backups
  (see `docs/AUTOMATED_BACKUP_SYSTEM.md`) are the data safety net — verify the
  latest backup completed before any risky promotion.
