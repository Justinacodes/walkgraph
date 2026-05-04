# Feature Blueprint: Scope Reconciliation

## Goal

Reconcile the PDF brief, PRD, and issue scaffold into a build-ready WalkGraph v1 scope: a **web/PWA-only school/campus pilot** that proves node-first indoor mapping and visitor navigation using the freest practical stack.

The v1 product should answer one question: can a school/campus team create a usable indoor graph map, publish it, and let visitors find rooms from a manual or QR start point without native mobile, paid map SDKs, or real-time indoor positioning?

## Components

### Client / PWA

- **Admin dashboard:** authentication, organization setup, school/campus building setup, floors, publication state, and route testing.
- **Mapper workspace:** floor selection, node creation, edge creation, auto-connect-to-previous-node prompt, edge metadata, QR checkpoint management, and route validation.
- **Public visitor experience:** published building discovery, indoor destination search, manual start selection, QR deep-link start, route preview, and step-by-step instructions.
- **Browser-local visitor storage:** recent/saved places and downloaded building packages stored locally by default unless a later approved blueprint changes this.
- **External outdoor routing links:** open Google Maps, Apple Maps, or another external map app/site to reach the building; WalkGraph takes over indoors.

### Server / Backend

- **Next.js App Router route handlers / server actions:** bounded to auth, organizations, buildings, floors, nodes, edges, routing, QR, publishing, and offline package export.
- **Auth.js / NextAuth:** admin, owner, and mapper authentication/session management.
- **Prisma + PostgreSQL/Supabase:** source of truth for organizations, buildings, graph data, publication state, and QR checkpoints.
- **Routing service:** TypeScript graph routing with Dijkstra for MVP; no paid routing provider is required for indoor paths.
- **Package export service:** versioned JSON snapshot for a published building, suitable for browser storage and offline read-only use.

## Data Flow

1. Admin signs in, creates or joins an organization, and receives owner/admin/mapper permissions.
2. Owner/admin creates a school/campus building with address/GPS metadata, floors, and draft visibility.
3. Mapper walks the building, adds real-world nodes, optionally assigns approximate x/y placement, and connects nodes with edges.
4. Mapper marks node/edge type, searchable labels, aliases/tags, direction hints, restricted status, stairs/elevator/ramp/accessibility flags, and approximate distance/time where available.
5. Mapper generates QR checkpoints for important nodes; each QR deep-link resolves to organization/building/floor/node context.
6. Admin tests start/destination pairs before publication and corrects confusing labels, missing edges, or bad accessibility metadata.
7. Owner/admin publishes the building; only published building data appears in public discovery and offline exports.
8. Visitor finds a published school/campus building, selects or scans a start node, searches a destination, and receives graph-based indoor directions.
9. Visitor downloads the published building package to browser storage; offline search/routing uses the last downloaded read-only package.

## Database Schema Impact

Use the existing Prisma/Postgres model direction as the baseline: `User`, `Organization`, `OrganizationMember`, `Building`, `Floor`, `Node`, `Edge`, `QRCheckpoint`, `MapVersion`, and possibly server-backed `SavedPlace` later.

### Expected v1 Schema Needs

- **Organizations and roles:** support owner/admin/mapper/viewer or equivalent authorization boundaries.
- **Buildings:** status should cover at least `draft`, `published`, and `archived`; school/campus pilot data should not require additional vertical-specific models.
- **Floors:** name, level number, optional description, and optional floor-plan image fields are enough; floor-plan upload remains optional polish.
- **Nodes:** building/floor references, name, type, description, optional x/y, searchable flag, tags/aliases, restricted flag, and accessibility flags.
- **Edges:** from/to node references, distance/walk-time estimates, direction hint, accessibility flags, stairs/elevator/ramp indicators, restricted flag, one-way flag, and vertical transition support through connected stair/elevator/ramp nodes.
- **QR checkpoints:** stable active checkpoint records pointing to building/floor/node IDs and producing deep links.
- **Map/package versions:** enough metadata to export a published package and let the browser detect whether a local package is stale.

### Deliberate Non-Impact for v1

- Do **not** add native mobile SQLite sync tables for v1.
- Do **not** add beacon, Wi-Fi fingerprint, AR, LiDAR, or indoor GPS positioning models.
- Do **not** require server-backed saved places for visitors in v1; saved places default to browser-local storage.
- Do **not** design conflict resolution or multi-device offline editing tables in this scope.

## In Scope

### Must-Build MVP / MUS

- **FR-001 Auth and sessions:** secure sign-in/register/logout and protected admin/mapper areas.
- **FR-002 Organization and building management:** create/manage organizations and first pilot school/campus buildings.
- **FR-003 Floor, node, and edge graph editor:** multi-floor graph creation with manual node/edge editing and approximate placement.
- **FR-004 Shortest-path route testing and public navigation:** Dijkstra route calculation, public destination search, and readable indoor directions.
- **FR-005 QR checkpoint generation:** scannable QR/deep links that set the visitor start node.
- **FR-006 Building publication and discovery:** draft/published/archived lifecycle and public explore filtered to published buildings.

### Brief-Important Pilot Scope Reconciled from Future FRs

The PRD marks FR-007 and FR-008 as `Future`, but the PDF brief treats offline and accessibility as important for MVP credibility. For the school/campus pilot, include **basic, bounded versions**:

- **FR-007 Basic offline package:** read-only published-building JSON export/download to browser storage for offline search and routing. No sync engine, no offline editing, no native SQLite requirement.
- **FR-008 Basic accessibility-aware routing:** route preference/filter that avoids restricted edges and stairs when a valid accessible alternative exists. Include clear no-route states and mark results as dependent on admin-provided accessibility metadata.

### Pilot Context

- First demo/pilot context remains **school/campus**: buildings with floors, lecture rooms, offices, corridors, stairs, elevators, entrances, and restrooms.
- The architecture may remain modular for churches, hospitals, offices, event centers, and malls later, but v1 acceptance should be validated against the school/campus pilot first.

## Deferred

Keep the following explicitly out of v1 unless a separate approved scope change replaces an existing MVP item:

- Expo or any native mobile app.
- Paid indoor/outdoor map SDK dependency for required v1 behavior.
- AR arrows or camera-based navigation.
- Bluetooth beacon deployment, Wi-Fi fingerprinting, LiDAR, 3D scanning, computer vision, automatic room detection, or real-time indoor GPS.
- Robust offline sync, conflict resolution, multi-device offline editing, or native SQLite package management.
- Public marketplace for building maps.
- Full OpenStreetMap indoor import/export.
- Crowd-aware routing, emergency simulation, analytics, multi-language directions, voice navigation, contribution workflows, and third-party API platform.
- Required photo capture, voice notes, compass guidance, step-count progress estimation, or floor-plan upload. These may be optional polish only after core graph routing works.
- Server-backed visitor accounts for saved places unless approved later; browser-local saved/recent places are the v1 default.

## Open Questions

1. **Auth provider finalization:** PRD says NextAuth/Auth.js; PDF lists several auth options. Current reconciled scope locks Auth.js/NextAuth unless owner changes it before build.
2. **QR scanning approach in 
