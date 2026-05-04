# Task 14: Pilot Polish, School/Campus Demo Data, QA, and Handoff

**Stage:** review
**Gate:** Gate 4 - Review and handoff
**Status:** blocked until tasks 07-13 complete
**Role:** review
**Workflow:** Takomi `mode-review` or `vibe-finalize`
**Required Skills:** takomi, nextjs-standards
**Dependencies:** 07, 08, 09, 10, 11, 12, 13
**Expected Artifact:** `docs/tasks/orchestrator-sessions/orch-20260504-140312/Orchestrator_Summary.md`

## Agent Setup

1. Confirm tasks 07-13 are complete. If not, stop and report blockers.
2. Read the Takomi skill and follow `mode-review` or `vibe-finalize`.
3. Read all five feature blueprints and any build baseline docs.
4. Read `docs/Project_Requirements.md` and `docs/issues/FR-001.md` through `docs/issues/FR-008.md`.

## Objective

Verify the web/PWA school/campus MVP is coherent, demo-ready, documented, and aligned with the brief.

## Scope

- School/campus seed or demo data.
- QA pass across admin, mapper, visitor, QR, routing, accessibility, and offline flows.
- Documentation sync.
- Final orchestrator summary and handoff notes.

## Implementation Constraints

- Keep polish scoped to demo readiness; do not expand MVP scope.
- Do not add deferred native, paid, AR, beacon, LiDAR, or robust sync work.
- If a file approaches 200 lines during polish, stop and propose extraction.
- Do not run `pnpm convex deploy`; this is a Prisma/Postgres project.

## Regression Checks

- FR-001 through FR-008 coverage.
- Cross-check against the extracted brief.
- Confirm all major feature docs match implementation.
- Confirm public/private data boundaries and role permissions.

## Definition of Done

- QA results are summarized in `Orchestrator_Summary.md`.
- Remaining issues are clearly separated into launch blockers and future work.
- Verification commands pass or blockers are documented with next steps.
