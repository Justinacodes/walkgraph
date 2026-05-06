# Task 11: Public Visitor PWA Search and Navigation

**Stage:** build
**Gate:** Gate 3 - Build sequence
**Status:** completed
**Role:** code
**Workflow:** Takomi `vibe-build`
**Required Skills:** takomi, nextjs-standards, frontend-design
**Dependencies:** 03, 05, 10
**Expected Artifact:** update `docs/features/01_Screen_Map.md` and `docs/features/03_Routing_Instruction_Design.md`

## Agent Setup

1. Confirm Gate 2 approval and completion of task 10. If missing, stop.
2. Read the Takomi skill and follow the `vibe-build` workflow.
3. Read `docs/features/01_Screen_Map.md` and `docs/features/03_Routing_Instruction_Design.md`.
4. Read `docs/issues/FR-004.md` and `docs/issues/FR-006.md`.

## Objective

Build or harden the public visitor PWA experience for finding a published campus building, searching destinations, choosing a start point, and following indoor directions.

## Scope

- Public building discovery.
- Indoor destination search using names, aliases, and tags.
- Manual start selection.
- Route preview and step-by-step navigation.
- Outdoor route deep links to the building when coordinates/address exist.

## Implementation Constraints

- Visitor flow must work without accounts.
- Keep the interface mobile-first and usable as a PWA.
- Do not add paid maps or native app dependencies.
- If a file approaches 200 lines, stop and propose extraction.
- Update docs for any route or screen behavior changes.

## Regression Checks

- FR-004 and FR-006 acceptance criteria.
- Draft/private buildings do not appear in public search.
- Visitor navigation uses the same route rules as the admin route tester.

## Definition of Done

- Visitor can search a published building and route from a selected start to a destination.
- Empty, missing route, and unpublished states are handled clearly.
- TypeScript and project verification pass or blockers are documented.

## Completion Notes

- Public discovery/search is limited to published/public buildings.
- Building detail and QR/manual navigation expose only unrestricted searchable nodes.
- Destination and start search now match names, descriptions, aliases, tags, and floor names.
- Visitor route UI handles already-there, accessibility warnings, and no-route states.
- Verification passed with `pnpm exec tsc --noEmit` and `python scripts/vibe-verify.py`.
