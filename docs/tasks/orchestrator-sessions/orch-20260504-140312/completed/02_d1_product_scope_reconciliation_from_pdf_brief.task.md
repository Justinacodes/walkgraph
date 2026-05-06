# Task 02: Scope Reconciliation and MVP Boundaries

**Stage:** design
**Gate:** Gate 1 - Design blueprints
**Status:** completedd
**Role:** architect
**Workflow:** Takomi `vibe-design`
**Required Skills:** takomi, avoid-feature-creep
**Expected Artifact:** `docs/features/00_Scope_Reconciliation.md`

## Agent Setup

1. Read the Takomi skill and follow the `vibe-design` workflow.
2. Read `docs/Orchestration_Plan.md`, `docs/Project_Requirements.md`, and `docs/Walk_Graph_Mvp_Project_Brief_extracted.txt`.
3. Read `docs/issues/FR-001.md` through `docs/issues/FR-008.md`.
4. Treat this as documentation-only work. Do not edit product code.

## Objective

Turn the brief into a clear web/PWA-only school/campus pilot scope that separates must-build MVP work from future native mobile, paid provider, and advanced positioning ideas.

## Scope

- Lock the free-first assumptions: Next.js PWA, Prisma/Postgres, NextAuth/Auth.js, QR deep links, and browser-based offline packages.
- Define MUS, pilot, and future boundaries.
- Resolve brief tension where offline/accessibility are listed as important but the existing PRD marks them future.
- Identify scope that should remain explicitly deferred.

## Inputs

- `docs/Walk_Graph_Mvp_Project_Brief_extracted.txt`
- `docs/Project_Requirements.md`
- `docs/issues/FR-001.md` through `docs/issues/FR-008.md`
- Existing app structure and Prisma schema as reference only.

## Output Requirements

Update `docs/features/00_Scope_Reconciliation.md` with:
- Goal.
- Components.
- Data flow.
- Database schema impact.
- In-scope, deferred, and open-question sections.
- Approval notes for Gate 2.

## Regression Checks

- Confirm no required v1 item depends on Expo, paid map SDKs, AR, beacons, LiDAR, or indoor GPS.
- Confirm school/campus remains the first pilot context.
- Confirm saved places default to browser-local unless a later approved blueprint changes it.

## Definition of Done

- The artifact is complete enough for an implementer to understand what v1 is and is not.
- The deferred list is explicit.
- Any remaining ambiguity is documented as an approval note, not hidden in implementation.
