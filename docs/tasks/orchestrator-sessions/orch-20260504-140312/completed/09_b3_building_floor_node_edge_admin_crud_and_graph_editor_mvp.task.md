# Task 09: Building/Floor/Node/Edge CRUD and Graph Editor

**Stage:** build
**Gate:** Gate 3 - Build sequence
**Status:** completed
**Role:** code
**Workflow:** Takomi `vibe-build`
**Required Skills:** takomi, nextjs-standards, frontend-design
**Dependencies:** 03, 04, 08
**Expected Artifact:** update `docs/features/01_Screen_Map.md` and `docs/features/02_Data_API_Audit.md`

## Agent Setup

1. Confirm Gate 2 approval and completion of task 08. If missing, stop.
2. Read the Takomi skill and follow the `vibe-build` workflow.
3. Read `docs/features/01_Screen_Map.md` and `docs/features/02_Data_API_Audit.md`.
4. Read `docs/issues/FR-002.md` and `docs/issues/FR-003.md`.

## Objective

Implement or harden the admin/mapper workflows for creating buildings, floors, nodes, and edges so a school/campus graph can be built manually.

## Scope

- Building and floor CRUD.
- Node creation, editing, deletion, type, aliases, tags, coordinates, and accessibility metadata.
- Edge creation, editing, deletion, one-way/restricted/accessibility metadata, and cross-building validation.
- Graph editor ergonomics for manual node-first mapping.

## Implementation Constraints

- Use existing Next.js, Prisma, Tailwind, and local component patterns.
- Keep floor plans/photos optional and future unless already safely present.
- If a code file approaches 200 lines, stop and propose extraction into components, hooks, services, or validation modules.
- Update feature docs with any implementation decisions.

## Regression Checks

- FR-002 and FR-003 acceptance criteria.
- Edge endpoints reject invalid cross-building or missing-node links.
- Mapper/admin permissions are enforced.
- UI remains mobile-friendly where mapper flow requires it.

## Definition of Done

- A mapper can build a basic multi-floor campus graph.
- Invalid graph mutations are rejected clearly.
- TypeScript and project verification pass or blockers are documented.
