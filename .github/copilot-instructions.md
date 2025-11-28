# GitHub Copilot Instructions (MyPonyClub Event Manager)

Version: v1.0 (2025-11-29)  
Purpose: Enable AI assistants to produce code and docs aligned with this project's established patterns and workflows. Keep answers concise, reference concrete files, and follow existing conventions rather than inventing new abstractions.

## Architecture & Domain Overview
- Framework: Next.js 14 (App Router) with TypeScript and functional React components only (hooks, no classes). Pages under `src/app`.
- Core Domains: Events (club / zone / state), Equipment Bookings, Email Queue, User / Role Management, Calendar UI, Data Import/Export & Backup.
- Data Storage: Firebase Firestore (client SDK for UI, Admin SDK for server/API and batch operations). Service account required for admin tasks (see `FIREBASE_SETUP.md`).
- Email System: Queue-based workflow (`src/lib/email-queue-admin.ts`, API routes under `src/app/api/email-queue`). Supports pending → approved lifecycle, integrates Resend for production, graceful fallback logs when API key absent.
- Equipment Booking Flow: Creation → pending approval (or auto-approve if conflict-free) → confirmation email. Separate templates for received vs confirmed in `src/lib/equipment-email-templates.ts`.
- Calendar: Complex year/month view component (`src/components/dashboard/event-calendar.tsx`) with filtering (zone/club, distance, sources) and PDF export logic.
- State vs Zone vs Club Events: State events have no `zoneId`/`clubId`. Zone events: `zoneId` only. Club events: both `zoneId` + `clubId`. Approval workflows apply only below state level.

## Key Conventions & Patterns
- Functional Components + Hooks: All UI components follow this (see `event-calendar.tsx`). Do not introduce class components.
- Firebase Modular v9+ Imports: Use tree-shaken modular APIs; never legacy namespaced imports.
- Role & Access Logic: Roles like `super_user`, `zone_rep`, `state_admin` defined in `src/lib/types.ts` & access helpers (`access-control.ts`). Respect role distinctions when adding features.
- Email Templates: HTML + plain text pairs; queue via `addEmailToQueue` with metadata. Follow pattern in `equipment-email-templates.ts` for new notification types.
- PDF Generation: Calendar & event request PDFs use jsPDF with careful layout constraints. Maintain compact typography and stable widths; avoid changing established layout IDs.
- Import / Export Systems: Long‑running operations expose progress stages (analysis, validation, mapping, import). Preserve multi-phase UX; examples in docs and scripts.
- Sorting & Filtering: Events filtered client-side with derived arrays (see `filteredEvents` in `event-calendar.tsx`). Extend by composing existing memoized selectors instead of duplicating logic.
- Status Handling: Use existing status strings (`pending`, `approved`, `rejected`, `public_holiday`, `ev_event`). Adding new statuses requires UI + email + PDF consideration.

## Critical Files & Their Significance
| Area | File | Notes |
|------|------|-------|
| Email Queue | `src/lib/email-queue-admin.ts` | Admin SDK operations; always normalize arrays (to[], cc[]). |
| Equipment Emails | `src/lib/equipment-email-templates.ts` | Distinct received vs confirmed templates—reuse structure for consistency. |
| Calendar UI | `src/components/dashboard/event-calendar.tsx` | Centralized filtering, view state, export; extend here not via forks. |
| Event Types & Roles | `src/lib/types.ts` | Source of truth for domain entities & role enums. |
| State Manager | `src/components/state-manager/state-event-management.tsx` | CRUD pattern for state-level events (auto-approved). |
| API Routes | `src/app/api/...` | App Router convention; server-side Firebase & auth tokens. |

## Development & Workflow
- Dev Server: `npm run dev` (port 9002). Production build: `npm run build`.
- Seeding Reference Data: `npm run seed-firestore` seeds zones/clubs/event types (not transactional data).
- Testing Scripts: PowerShell helpers (`test-simple.ps1`, others) cover health, queue ops, and API validation—use them before refactoring server code.
- Authentication (Dev): Bearer tokens `admin-token` / `dev-admin-token` in headers for protected endpoints.
- Email Behavior: If `RESEND_API_KEY` absent, system logs emails instead of sending; code must still enqueue properly.

## Adding or Modifying Features (Guidelines)
1. Extend existing service modules (e.g., add booking logic inside equipment service) rather than creating parallel subsystems.
2. Preserve queue semantics: new email types must include `metadata` to aid admin interface filtering.
3. Maintain separation of concerns: UI components only orchestrate; heavy business logic belongs in `src/lib/*` modules.
4. Ensure any new async Firebase calls are wrapped in try/catch with user-facing error states where applicable.
5. For new PDF outputs: follow sizing & layout patterns from existing implementations; avoid unbounded growth in file size.
6. Avoid broad schema changes; if unavoidable, update all dependent templates, tests, and docs simultaneously.

## Performance & UX Considerations
- Use `useMemo` / `useAtom` patterns already present for expensive list computations (calendar events, filters).
- Keep large tables horizontally scrollable (`overflow-x-auto`, min-width constraints) consistent with calendar design.
- Minimize re-renders by stable dependency arrays and avoiding inline object/array literals in props.

## Security & Data Integrity
- Never embed secrets in client bundle; all keys through `.env.local`.
- Sanitize any user-provided text before including in emails or PDFs (follow existing patterns for safe interpolation).
- Role-based access: enforce checks server-side in API routes; client gating is supplemental only.

## When Unsure
- Look for a precedent first (email queue operations, booking approval, filtering patterns).
- Prefer augmenting existing interfaces over introducing new global state managers.
- If adding a new domain concept, align naming with existing camelCase & descriptive patterns.

## Examples
- Adding a new notification: replicate `queueBookingReceivedEmail` shape; include both HTML/text and `emailType` metadata.
- Adding calendar source filter: extend `eventSourceAtom` plus adjust `sourceFilteredEvents` in `event-calendar.tsx`.
- State-only event addition: mimic state event identification (no `zoneId`/`clubId`, status = `approved`).

## DO NOT
- Introduce class components.
- Use legacy Firebase SDK imports.
- Bypass email queue for production notifications.
- Modify status strings casually (they drive filtering & styling).
- Add global state libraries beyond existing patterns (Jotai already in use).

- Record all prompts in a central file 
- update documentation and readme documents with each change 
- use proper change update messages when committing code
- keep a change history log for future reference

