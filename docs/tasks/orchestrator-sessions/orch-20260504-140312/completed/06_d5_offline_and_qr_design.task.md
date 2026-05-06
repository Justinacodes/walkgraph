# Task 06: Offline Package and QR Positioning Design

**Stage:** design
**Gate:** Gate 1 - Design blueprints
**Status:** completed
**Role:** architect
**Workflow:** Takomi `vibe-design`
**Required Skills:** takomi, nextjs-standards
**Dependencies:** 02, 03, 04
**Expected Artifact:** `docs/features/04_Offline_QR_Design.md`

## Agent Setup

1. Read the Takomi skill and follow the `vibe-design` workflow.
2. Read `docs/features/00_Scope_Reconciliation.md`, `docs/features/01_Screen_Map.md`, and `docs/features/02_Data_API_Audit.md`.
3. Inspect existing QR and download routes under `app/api/`.
4. Treat this as documentation-only work. Do not edit product code.

## Objective

Design the free-first QR and basic offline package behavior for a web/PWA pilot.

## Scope

- QR checkpoint generation and printable output.
- QR deep-link format for start-node positioning.
- Published building package contents.
- Browser storage approach for basic offline search and routing.
- Clear limitations: no robust sync, no native SQLite, no offline editing.

## Inputs

- `docs/issues/FR-005.md` and `docs/issues/FR-007.md`
- `docs/Walk_Graph_Mvp_Project_Brief_extracted.txt`
- Existing `QRCheckpoint`, `MapVersion`, and download route behavior.

## Output Requirements

Update `docs/features/04_Offline_QR_Design.md` with:
- Goal.
- Components.
- Data flow.
- Database schema impact.
- QR link shape.
- Offline package contents.
- Failure states and limitations.

## Regression Checks

- Confirm QR links resolve only active checkpoints.
- Confirm offline packages include published/client-safe data only.
- Confirm browser-local saved places do not require visitor accounts in v1.
- Confirm no Expo/native mobile implementation is implied.

## Definition of Done

- Build tasks 12 and 13 can implement QR and offline package behavior from the blueprint.
- Limitations and future native path are documented clearly.
