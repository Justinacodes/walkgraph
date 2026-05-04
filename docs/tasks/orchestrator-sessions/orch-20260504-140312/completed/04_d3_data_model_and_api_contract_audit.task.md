# Task 04: Data Model and API Contract Audit

**Stage:** design
**Gate:** Gate 1 - Design blueprints
**Status:** completedd
**Role:** architect
**Workflow:** Takomi `vibe-design`
**Required Skills:** takomi, nextjs-standards
**Expected Artifact:** `docs/features/02_Data_API_Audit.md`

## Agent Setup

1. Read the Takomi skill and follow the `vibe-design` workflow.
2. Read `docs/Orchestration_Plan.md`, `docs/Project_Requirements.md`, and `docs/features/00_Scope_Reconciliation.md`.
3. Inspect `prisma/schema.prisma`, `app/api/`, `lib/validations/`, and `lib/routing/`.
4. Treat this as documentation-only work. Do not edit product code or schema.

## Objective

Audit existing Prisma models and API routes against the MVP brief, using current implementation as the baseline and documenting only necessary changes.

## Scope

- Auth, roles, organizations, and team permissions.
- Building, floor, node, edge, QR, search, route, publish, and download APIs.
- Public versus protected data boundaries.
- Offline package and map version implications.
- Data integrity gaps for graph relationships.

## Inputs

- `prisma/schema.prisma`
- Existing `app/api/**/route.ts` files.
- `docs/issues/FR-001.md` through `docs/issues/FR-008.md`
- `docs/Walk_Graph_Mvp_Project_Brief_extracted.txt`

## Output Requirements

Update `docs/features/02_Data_API_Audit.md` with:
- Goal.
- Components.
- Data flow.
- Database schema impact.
- API contract table.
- Schema/API gap list.
- Security and privacy checks.

## Regression Checks

- Confirm public APIs expose only published/client-safe building data.
- Confirm admin mutations require membership and role checks.
- Confirm edges cannot connect nodes from different buildings.
- Confirm no service-role or private environment secret reaches client code.

## Definition of Done

- The audit clearly says what can stay as-is and what must change later.
- Any schema migration need is documented before build starts.
- Build tasks can use this as the contract source.
