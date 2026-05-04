# Feature Blueprint: Scope Reconciliation

## Goal

Translate the WalkGraph MVP brief into a web/PWA-only school/campus pilot that proves indoor graph mapping, search, QR starting position, routing, and basic offline building packages without paid positioning or native mobile complexity.

## Components

### Client
- Public landing and explore flows for visitors.
- Admin dashboard for organizations, buildings, publishing, and route testing.
- Mapper screens for floors, nodes, edges, QR checkpoints, and accessibility metadata.
- Mobile-first visitor navigation screens for search, manual/QR start, route preview, and step-by-step guidance.

### Server
- Next.js route handlers for auth, organizations, buildings, floors, nodes, edges, search, routing, QR, publish, and downloads.
- Prisma-backed data persistence in Supabase/Postgres.
- Server-side authorization for owner, admin, and mapper actions.

## Data Flow

1. Admin registers and creates or joins an organization.
2. Admin creates a school/campus building and floors.
3. Mapper adds nodes and edges while walking the building.
4. Admin tests routes and publishes the building.
5. Visitor searches the published building, chooses a start point manually or by QR, and receives indoor directions.
6. Visitor can download the published building package for basic offline use.

## Database Schema

Use the existing Prisma schema as the baseline: `User`, `Organization`, `OrganizationMember`, `Building`, `Floor`, `Node`, `Edge`, `QRCheckpoint`, `SavedPlace`, and `MapVersion`.

Design tasks must audit whether the schema needs small additions for publication snapshots, offline package versions, or browser-local saved places metadata. Do not add native mobile or robust sync schema in v1.

## MVP In Scope

- FR-001 through FR-006 as core MUS.
- Basic versions of FR-007 and FR-008 because the brief calls out offline and accessibility early.
- School/campus demo data and QA.

## Deferred

- Expo/native mobile app.
- AR, beacons, Wi-Fi fingerprinting, LiDAR, 3D scanning, and real-time indoor GPS.
- Paid map SDKs unless a pilot requirement forces it.
- Complex offline sync and conflict handling.
- Required photo upload or floor-plan overlay.

## Regression Checks

- Cross-check against `docs/Project_Requirements.md`.
- Cross-check against `docs/issues/FR-001.md` through `docs/issues/FR-008.md`.
- Cross-check against `docs/Walk_Graph_Mvp_Project_Brief_extracted.txt`, especially sections 5, 6, 8, 9, 13, 14, and 15.

## Approval Notes

This blueprint must be approved before build tasks begin. If scope grows, add a new task instead of expanding an existing task silently.
