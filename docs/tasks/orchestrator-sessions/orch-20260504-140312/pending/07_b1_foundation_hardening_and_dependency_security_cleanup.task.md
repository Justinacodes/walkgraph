# Task 07: Foundation Hardening and Dependency/Security Cleanup

**Stage:** build
**Gate:** Gate 3 - Build sequence
**Status:** blocked until Gate 2 owner approval
**Role:** code
**Workflow:** Takomi `vibe-build`
**Required Skills:** takomi, nextjs-standards
**Dependencies:** 02, 04, Gate 2 approval
**Expected Artifact:** `docs/features/10_Build_Baseline.md`

## Agent Setup

1. Confirm the user has approved Gate 1 blueprints. If not, stop.
2. Read the Takomi skill and follow the `vibe-build` workflow.
3. Read `docs/Orchestration_Plan.md`, `docs/Project_Requirements.md`, `docs/features/00_Scope_Reconciliation.md`, and `docs/features/02_Data_API_Audit.md`.
4. Inspect `package.json`, `pnpm-lock.yaml`, env examples, and verification scripts.

## Objective

Prepare the existing Next.js/Prisma app for reliable MVP build work while staying on the free-first web/PWA path.

## Scope

- Review dependency/security baseline and document any risky versions.
- Normalize verification scripts if needed.
- Confirm env boundaries and secret handling.
- Produce a gap checklist that later build tasks can rely on.

## Implementation Constraints

- Do not introduce paid services.
- Do not add Expo/native tooling.
- If a code file approaches 200 lines, stop and propose extraction unless the reason to keep it is documented.
- Update the expected artifact with every major finding or code change.

## Regression Checks

- Cross-check against FR-001 through FR-008.
- Confirm no Convex deploy step is used; this project uses Prisma/Postgres.
- Confirm product code still compiles after changes.

## Definition of Done

- Verification status is documented.
- Security/dependency gaps are resolved or explicitly logged.
- `docs/features/10_Build_Baseline.md` captures what changed and what remains.
