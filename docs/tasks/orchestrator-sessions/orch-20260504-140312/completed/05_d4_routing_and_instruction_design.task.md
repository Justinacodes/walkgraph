# Task 05: Routing and Human-Readable Instruction Design

**Stage:** design
**Gate:** Gate 1 - Design blueprints
**Status:** complete
**Role:** architect
**Workflow:** Takomi `vibe-design`
**Required Skills:** takomi, nextjs-standards
**Dependencies:** 02, 04
**Expected Artifact:** `docs/features/03_Routing_Instruction_Design.md`

## Agent Setup

1. Read the Takomi skill and follow the `vibe-design` workflow.
2. Read `docs/features/00_Scope_Reconciliation.md` and `docs/features/02_Data_API_Audit.md`.
3. Inspect `lib/routing/dijkstra.ts`, `lib/routing/graph-builder.ts`, and `lib/routing/types.ts`.
4. Treat this as documentation-only work. Do not edit product code.

## Objective

Define the routing rules, accessibility behavior, multi-floor assumptions, and instruction-generation standards for admin route testing and visitor navigation.

## Scope

- Dijkstra weights and tie-breaker preferences.
- Restricted, stairs, elevator, ramp, accessibility, and one-way edge behavior.
- Multi-floor movement through stairs/elevators/ramps.
- Human-readable instruction patterns and edge `directionHint` precedence.
- Route tester acceptance cases.

## Inputs

- `docs/issues/FR-004.md` and `docs/issues/FR-008.md`
- `docs/Walk_Graph_Mvp_Project_Brief_extracted.txt`
- Existing routing library files.

## Output Requirements

Update `docs/features/03_Routing_Instruction_Design.md` with:
- Goal.
- Components.
- Data flow.
- Database schema impact.
- Routing rules.
- Instruction patterns.
- Test scenarios and edge cases.

## Regression Checks

- Confirm route tester and visitor navigation use the same route rules.
- Confirm restricted edges are not used by default.
- Confirm accessible mode avoids stairs when a valid alternative exists.
- Confirm multi-floor routes produce explicit floor-change instructions.

## Definition of Done

- Build task 10 can implement routing and instruction changes without inventing core rules.
- Edge cases are documented instead of left implicit.
