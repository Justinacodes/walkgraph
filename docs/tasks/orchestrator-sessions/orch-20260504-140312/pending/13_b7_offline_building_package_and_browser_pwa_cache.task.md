# Task 13: Basic Offline Building Package

**Stage:** build
**Gate:** Gate 3 - Build sequence
**Status:** blocked until Gate 2 owner approval
**Role:** code
**Workflow:** Takomi `vibe-build`
**Required Skills:** takomi, nextjs-standards
**Dependencies:** 06, 10, 11
**Expected Artifact:** update `docs/features/04_Offline_QR_Design.md`

## Agent Setup

1. Confirm Gate 2 approval and completion of tasks 10 and 11. If missing, stop.
2. Read the Takomi skill and follow the `vibe-build` workflow.
3. Read `docs/features/02_Data_API_Audit.md`, `docs/features/03_Routing_Instruction_Design.md`, and `docs/features/04_Offline_QR_Design.md`.
4. Read `docs/issues/FR-007.md`.

## Objective

Implement or harden a basic browser-based offline package for published buildings.

## Scope

- Public building download endpoint.
- Client-safe package shape with metadata, floors, nodes, edges, QR references, aliases/tags, and version/timestamp.
- Browser-side save/status/load behavior.
- Offline search and route calculation where cached data is available.

## Implementation Constraints

- Basic offline only: no sync conflicts, offline editing, native SQLite, or Expo.
- Do not cache private drafts or secrets.
- If a file approaches 200 lines, stop and propose extraction.
- Update the offline blueprint with the final package shape.

## Regression Checks

- FR-007 acceptance criteria.
- Package contains published/client-safe data only.
- Offline route behavior matches online route rules as closely as practical.
- App clearly shows when cached data is stale or unavailable.

## Definition of Done

- Visitor can download a published building package.
- Cached package can support basic search/routing without network where practical.
- TypeScript and project verification pass or blockers are documented.
