# Task 03: Information Architecture and Screen Map

**Stage:** design
**Gate:** Gate 1 - Design blueprints
**Status:** completedd
**Role:** design
**Workflow:** Takomi `vibe-design`
**Required Skills:** takomi, frontend-design
**Expected Artifact:** `docs/features/01_Screen_Map.md`

## Agent Setup

1. Read the Takomi skill and follow the `vibe-design` workflow.
2. Read `docs/Orchestration_Plan.md`, `docs/Project_Requirements.md`, and `docs/features/00_Scope_Reconciliation.md`.
3. Review existing routes under `app/` to understand current screens.
4. Treat this as documentation-only work. Do not edit product code.

## Objective

Define the screen architecture for admin, mapper, visitor, QR, and offline flows in a mobile-first Next.js PWA pilot.

## Scope

- Admin organization and building management.
- Mapper floor, node, edge, QR, route-test, and accessibility workflows.
- Visitor public search, building detail, start selection, QR start, route preview, and navigation.
- Offline download/status flow for published buildings.

## Inputs

- `docs/features/00_Scope_Reconciliation.md`
- `docs/Walk_Graph_Mvp_Project_Brief_extracted.txt`, especially section 15.
- Existing app routes and components.

## Output Requirements

Update `docs/features/01_Screen_Map.md` with:
- Goal.
- Components.
- Data flow.
- Database schema impact.
- Screen groups and key user journeys.
- FR mapping for each major screen group.

## Regression Checks

- Confirm every screen maps to FR-001 through FR-008 or is marked future.
- Avoid landing-page-only planning where usable app screens are required.
- Keep Expo/native screens out of v1.

## Definition of Done

- The screen map is detailed enough for build tasks 09, 11, 12, and 13 to implement without deciding the main navigation structure.
- Future-only screens are clearly marked.
