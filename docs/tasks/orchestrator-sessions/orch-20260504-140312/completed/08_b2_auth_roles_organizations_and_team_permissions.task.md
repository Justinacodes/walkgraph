# Task 08: Auth, Roles, Organizations, and Permissions

**Stage:** build
**Gate:** Gate 3 - Build sequence
**Status:** completed
**Role:** code
**Workflow:** Takomi `vibe-build`
**Required Skills:** takomi, nextjs-standards
**Dependencies:** 02, 03, 04, 07
**Expected Artifact:** update `docs/features/02_Data_API_Audit.md`

## Agent Setup

1. Confirm Gate 2 approval and completion of task 07. If either is missing, stop.
2. Read the Takomi skill and follow the `vibe-build` workflow.
3. Read `docs/features/00_Scope_Reconciliation.md`, `docs/features/01_Screen_Map.md`, and `docs/features/02_Data_API_Audit.md`.
4. Read `docs/issues/FR-001.md` and `docs/issues/FR-002.md`.

## Objective

Make authentication, organization ownership, and role-based access reliable enough for the MVP admin and mapper flows.

## Scope

- Registration/login/session behavior.
- Organization ownership and membership.
- OWNER, ADMIN, MAPPER, and VIEWER permissions.
- Protected dashboard access and API mutation authorization.

## Implementation Constraints

- Keep auth on NextAuth/Auth.js and Prisma.
- Do not add paid auth providers.
- Keep visitor navigation account-free unless an approved blueprint changes this.
- If a code file approaches 200 lines, stop and propose extraction.
- Update feature docs when behavior changes.

## Regression Checks

- FR-001 and FR-002 acceptance criteria.
- Public visitor pages remain accessible without login.
- Unauthorized users cannot create/edit another organization's buildings.

## Definition of Done

- Auth and role behavior is implemented or verified.
- Permission gaps are fixed or documented.
- TypeScript and project verification pass or blockers are documented.
