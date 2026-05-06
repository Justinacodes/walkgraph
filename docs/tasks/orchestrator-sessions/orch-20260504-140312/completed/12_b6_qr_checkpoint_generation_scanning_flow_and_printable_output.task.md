# Task 12: QR Generation, Scan/Deep-Link Flow, and Printable Output

**Stage:** build
**Gate:** Gate 3 - Build sequence
**Status:** completed
**Role:** code
**Workflow:** Takomi `vibe-build`
**Required Skills:** takomi, nextjs-standards
**Dependencies:** 06, 09, 11
**Expected Artifact:** update `docs/features/04_Offline_QR_Design.md`

## Agent Setup

1. Confirm Gate 2 approval and completion of tasks 09 and 11. If missing, stop.
2. Read the Takomi skill and follow the `vibe-build` workflow.
3. Read `docs/features/01_Screen_Map.md` and `docs/features/04_Offline_QR_Design.md`.
4. Read `docs/issues/FR-005.md`.

## Objective

Implement or harden QR checkpoints so visitors can scan a printed code and start navigation from the correct node.

## Scope

- QR checkpoint management for important nodes.
- QR code generation using existing free dependency choices.
- Printable QR output.
- Visitor deep-link route that preselects building/floor/node start.
- Handling inactive, missing, or unpublished checkpoint states.

## Implementation Constraints

- Prefer opaque checkpoint codes over exposing fragile assumptions.
- Do not add native camera dependencies for v1; use QR links/scanning through browser-capable flow where practical.
- If a file approaches 200 lines, stop and propose extraction.
- Update the QR/offline blueprint with implemented link shape.

## Regression Checks

- FR-005 acceptance criteria.
- Inactive checkpoints do not start navigation.
- QR links do not expose private/draft building data.
- Visitor can still choose a manual start without QR.

## Definition of Done

- [x] Mapper can generate printable QR codes for nodes.
- [x] Scanned/opened QR link starts the public navigation flow at the correct node.
- [x] TypeScript and project verification pass or blockers are documented.
