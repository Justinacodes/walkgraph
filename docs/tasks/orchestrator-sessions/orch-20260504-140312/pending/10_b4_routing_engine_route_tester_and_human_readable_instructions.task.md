# Task 10: Routing Engine, Route Tester, and Instructions

**Stage:** build
**Gate:** Gate 3 - Build sequence
**Status:** blocked until Gate 2 owner approval
**Role:** code
**Workflow:** Takomi `vibe-build`
**Required Skills:** takomi, nextjs-standards
**Dependencies:** 04, 05, 09
**Expected Artifact:** update `docs/features/03_Routing_Instruction_Design.md`

## Agent Setup

1. Confirm Gate 2 approval and completion of task 09. If missing, stop.
2. Read the Takomi skill and follow the `vibe-build` workflow.
3. Read `docs/features/02_Data_API_Audit.md` and `docs/features/03_Routing_Instruction_Design.md`.
4. Read `docs/issues/FR-004.md` and `docs/issues/FR-008.md`.

## Objective

Implement or harden indoor route calculation, admin route testing, and human-readable route instructions.

## Scope

- Graph loading and pathfinding.
- Route API behavior.
- Admin route tester.
- Instruction generation and edge hint precedence.
- Accessibility-aware route behavior.
- Multi-floor route handling.

## Implementation Constraints

- Keep routing graph-based and server-safe.
- Do not introduce paid routing providers for indoor navigation.
- If a routing or UI file approaches 200 lines, stop and propose extraction.
- Update the routing blueprint with any implemented rule changes.

## Regression Checks

- FR-004 and FR-008 acceptance criteria.
- Restricted edges are excluded by default.
- Accessible routes avoid stairs when possible.
- Route tester and visitor route behavior match.

## Definition of Done

- Admin can test a route before publish.
- Route output includes path, estimates, floor changes, and readable instructions.
- TypeScript and project verification pass or blockers are documented.
