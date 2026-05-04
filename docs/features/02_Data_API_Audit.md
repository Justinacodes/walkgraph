# Feature Blueprint: Data Model and API Contract Audit

## Goal

Audit WalkGraph's current Prisma models and API route contracts against FR-001 through FR-008 and the MVP brief, using the existing implementation as the baseline. This document is the build-stage contract source for schema/API hardening; it documents what can stay as-is and what must change later before or during build tasks.

Auth note: per task instruction, `oauth-router` is treated only as the provider/model-routing strategy context for this audit. It is **not** an app authentication provider. Existing project docs and code require NextAuth/Auth.js for application auth, so all app auth findings below refer to the existing NextAuth/Auth.js implementation.

## Components

### Database / Prisma Baseline

- `User`, `Account`, `Session`, `VerificationToken`: compatible with Auth.js/NextAuth credentials and Prisma adapter usage.
- `Organization`, `OrganizationMember`: supports ownership, membership, and role enum (`OWNER`, `ADMIN`, `MAPPER`, `VIEWER`).
- `Building`, `Floor`: covers school/campus building setup, publication status, visibility, location, and optional floor plan metadata.
- `Node`, `Edge`: covers graph editor, routing, approximate coordinates, searchable metadata, restrictions, accessibility flags, and vertical-transition edge flags.
- `QRCheckpoint`: covers stable node-bound QR codes with active/inactive state and label.
- `MapVersion`: covers publish snapshots and future offline package/version metadata.
- `SavedPlace`: exists server-side, but MVP scope says visitor saved/recent places should remain browser-local unless later approved.

### API Route Baseline

- Auth: `app/api/auth/[...nextauth]/route.ts`, `app/api/auth/register/route.ts`.
- Organizations: `app/api/organizations/route.ts`, `app/api/organizations/[orgId]/route.ts`.
- Buildings/publication/download: `app/api/buildings/route.ts`, `app/api/buildings/[buildingId]/route.ts`, `app/api/buildings/[buildingId]/publish/route.ts`, `app/api/buildings/[buildingId]/download/route.ts`.
- Graph editor: `app/api/floors/**`, `app/api/nodes/**`, `app/api/edges/**`.
- Visitor/navigation: `app/api/search/route.ts`, `app/api/route/route.ts`.
- QR: `app/api/qr/[nodeId]/route.ts`.
- Upload: `app/api/upload/route.ts` for optional floor/building imagery.

### Validation / Routing Helpers

- Existing validation helpers under `lib/validations/` cover auth, organization, building, floor, node, and edge inputs.
- Routing helpers under `lib/routing/` build a graph from Prisma and run Dijkstra.
- `oauth-router` is not involved in product authorization; if used by agents/build tooling, it must remain outside client/runtime app auth contracts.

## Data Flow

1. Admin registers or signs in through NextAuth/Auth.js credentials auth; session user ID is added via JWT/session callbacks.
2. Authenticated owner creates organizations and buildings; future build hardening should allow authorized `OWNER`/`ADMIN` members, not only `organization.ownerId`.
3. Authorized mapper/admin creates floors, nodes, and edges. Mutations should validate payload shape and then enforce organization membership/role access to the target building.
4. Graph editor reads should be protected for draft/private buildings, but may be public for published/client-safe graph data via explicit public endpoints.
5. Publish flow creates/updates a published building state and `MapVersion` snapshot after validating graph completeness.
6. Visitor search/discovery reads only `PUBLISHED` + `PUBLIC` buildings. Destination/node search must confirm the selected building is published before returning nodes.
7. Route requests load graph data for the requested building and calculate shortest path. Public route calculation must reject draft/private buildings unless requester is an authorized admin/mapper testing a draft.
8. QR generation is protected and creates/finds an active checkpoint for a node. QR deep links should resolve only to public navigation for published buildings or to protected admin preview/testing when authenticated.
9. Download/offline export returns a versioned, client-safe, read-only package for published buildings only.

## Database Schema Impact

### Can Stay As-Is for MVP

- Core model set is broadly aligned with the MVP: organizations, buildings, floors, nodes, edges, QR checkpoints, and map versions already exist.
- `Building.status` with `DRAFT`, `PUBLISHED`, `ARCHIVED` satisfies publication lifecycle.
- `Visibility` enum supports public/private/org-only boundaries.
- `Node.tags`, `Node.aliases`, and `Node.searchable` support destination search without a new search table.
- `Edge` accessibility/restriction fields are sufficient for basic FR-008 routing filters.
- `QRCheckpoint.active`, `label`, and unique `code` are enough for v1 checkpoint generation.
- `MapVersion.snapshotJson` is sufficient for a basic published-building offline snapshot.

### Must Change / Harden Before or During Build

1. **Graph relationship integrity:** Prisma cannot currently enforce that `Node.floorId` belongs to the same `Building` as `Node.buildingId`, or that `Edge.fromNodeId` and `Edge.toNodeId` both belong to `Edge.buildingId`. Enforce in route/service transactions before create/update. Consider later composite constraints if schema complexity is acceptable.
2. **Membership authorization:** Current model supports roles, but existing routes mostly check `organization.ownerId`. Build should introduce a shared authorization helper: `OWNER`/`ADMIN` can manage org/building/publish; `MAPPER` can manage floors/nodes/edges/QR; `VIEWER` read-only for protected admin contexts.
3. **Public-safe payloads:** Several read routes return full Prisma records by `buildingId` or ID. Build should define explicit DTO/select shapes for public responses to avoid leaking draft/private details, internal timestamps where unnecessary, and restricted nodes/edges beyond routing needs.
4. **Published-only visitor graph access:** `search` with `buildingId`, `route`, and graph `GET` routes must first verify the building is published/public for unauthenticated visitors.
5. **Publish validation:** Before setting `PUBLISHED`, require at least one floor, searchable destination nodes, connected graph edges, and no cross-building/cross-floor reference inconsistency.
6. **MapVersion uniqueness:** Add or enforce uniqueness for `(buildingId, versionNumber)` before relying on version comparisons for offline packages.
7. **Edge duplication:** Consider application-level prevention of duplicate `fromNodeId`/`toNodeId` edges per building unless parallel edges are intentionally supported.
8. **SavedPlace scope:** Do not use server-backed `SavedPlace` for visitor MVP saved places unless a later scope decision adds visitor accounts; default to browser-local storage.

## API Contract Table

| Area / FR | Current Endpoint(s) | Baseline Status | Build Contract / Required Hardening |
| --- | --- | --- | --- |
| FR-001 Auth | `POST /api/auth/register`, NextAuth routes | Mostly aligned | Keep NextAuth/Auth.js. Validate inputs, hash passwords, never expose `passwordHash`, and keep `oauth-router` limited to agent/provider routing context only. |
| FR-002 Organizations | `GET/POST /api/organizations`, `GET/PATCH/DELETE /api/organizations/:orgId` | Partial | Move from owner-only checks to membership/role checks. Return only orgs where user is owner/member. Slug uniqueness can stay. |
| FR-002 Buildings | `GET/POST /api/buildings`, `GET/PATCH/DELETE /api/buildings/:buildingId` | Partial | Admin reads/mutations require authorized organization membership. Public building reads must use published/public filtering and safe selects. |
| FR-003 Floors | `GET/POST /api/floors`, `GET/PATCH/DELETE /api/floors/:floorId` | Partial | Protect draft/private reads. Mutations require `OWNER`/`ADMIN`/`MAPPER`. Validate floor belongs to authorized building. |
| FR-003 Nodes | `GET/POST /api/nodes`, `GET/PATCH/DELETE /api/nodes/:nodeId` | Partial | Protect non-public reads. On create/update verify `floorId` belongs to `buildingId`. Use safe public DTOs for visitor payloads. |
| FR-003 Edges | `GE
