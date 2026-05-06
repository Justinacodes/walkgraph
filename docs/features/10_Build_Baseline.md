# Feature Build Baseline: Foundation Hardening

## Goal

Prepare WalkGraph for the MUS build sequence on the free-first web/PWA stack: Next.js App Router, Prisma/Postgres, NextAuth/Auth.js, and browser/PWA capabilities. This baseline corresponds to orchestrator task 07.

## User Approval

Gate 1 design blueprints were accepted by the owner on 2026-05-04 with: "ok then I think that's fine ... let's move on". Build may proceed.

## Components Reviewed

- `package.json`
- `pnpm-lock.yaml`
- `.env.example`
- `scripts/vibe-verify.py`
- Next.js config files
- FR issue files `docs/issues/FR-001.md` through `docs/issues/FR-008.md`
- Design contracts in `docs/features/00_*` through `docs/features/04_*`

## Changes Made

1. Upgraded `next` from `14.2.20` to `15.5.15` to clear known critical/high Next.js middleware, RSC, image optimizer, and request smuggling advisories reported by `pnpm audit`.
2. Upgraded `eslint-config-next` from `14.2.20` to `15.5.15` to match the Next.js runtime major/minor line.
3. Added a pnpm override for `postcss@^8.5.10` so transitive PostCSS advisories resolve to the patched line.
4. Removed duplicate `next.config.mjs`; `next.config.ts` is now the single Next.js config source.
5. Confirmed verification uses pnpm and does not reference Convex deploy steps.
6. Updated dynamic route/page/layout param handling to the Next.js 15 async `params`/`searchParams` contract so production build succeeds.

## Verification Status

- Baseline TypeScript before dependency changes: PASS (`pnpm exec tsc --noEmit`).
- Quick verification before dependency changes: PASS (`python scripts/vibe-verify.py --quick`).
- TypeScript after Next/PostCSS/config changes: PASS (`pnpm exec tsc --noEmit`).
- Quick verification after changes: PASS (`python scripts/vibe-verify.py --quick`).
- Initial full verification after the Next 15 upgrade exposed async route-param build errors; fixed across dynamic API routes/pages/layouts.
- Final full verification: PASS (`python scripts/vibe-verify.py`).
- Audit after changes: one remaining moderate advisory from `next-auth -> uuid <14`.

## Dependency / Security Findings

### Resolved or Reduced

- Next.js critical/high/moderate advisories from the previous `14.2.20` baseline are resolved by `next@15.5.15`.
- Transitive PostCSS advisory is resolved via pnpm override to `^8.5.10`.
- Duplicate Next.js configuration has been removed to avoid ambiguous config behavior.

### Remaining Logged Risk

- `next-auth@4.24.10` depends on `uuid@8.3.2`, which currently triggers GHSA-w5hq-g745-h8pq as a moderate advisory.
- This app uses the credentials provider, not UUID v3/v5/v6 buffer APIs directly.
- Do not force an override to `uuid@14` without testing because major-version ESM/API changes can break NextAuth v4 internals.
- Revisit when upgrading Auth.js/NextAuth or when a safe upstream patch is available.

## Environment Boundary Check

- `.env.example` uses placeholders and does not expose real secrets.
- `.env.local` is intentionally not printed or copied into docs.
- `NEXT_PUBLIC_*` variables are limited to browser-safe values.
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `NEXTAUTH_SECRET` must remain server-only and uncommitted.

## Build Gap Checklist for Later Tasks

- FR-001: Confirm NextAuth still works after Next 15 upgrade; harden registration/login UX and protected routes.
- FR-002: Replace owner-only authorization with shared org membership/role checks.
- FR-003: Enforce same-building/same-floor graph integrity before node/edge mutations persist.
- FR-004: Ensure route/search APIs filter public visitors to published buildings only.
- FR-005: Ensure QR URLs use `NEXT_PUBLIC_APP_URL` and inactive checkpoints fail clearly.
- FR-006: Add publish validation before exposing buildings publicly.
- FR-007: Keep offline package read-only and browser-stored for v1.
- FR-008: Implement basic accessible-route filtering without expanding into native/mobile scope.

## Commands Used

```bash
pnpm exec tsc --noEmit
python scripts/vibe-verify.py --quick
pnpm audit --audit-level moderate
pnpm add next@15.5.15 eslint-config-next@15.5.15 postcss@^8.5.10
pnpm install
```
