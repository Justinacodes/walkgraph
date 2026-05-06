# Feature Blueprint: Offline Package and QR Positioning Design

## Task 12 Build Update

Task 12 now hardens `GET /api/qr/[nodeId]` to enforce mapper/admin authorization, reuse stable active checkpoints, repair checkpoint building/floor consistency when needed, and generate canonical visitor links with `NEXT_PUBLIC_APP_URL` via `/navigate/{buildingId}?node={checkpointCode}`. The dashboard QR manager supports loading/generating printable checkpoint cards with QR image, short manual code, and fallback URL, while the public navigator now surfaces resolved, inactive, and invalid checkpoint states and keeps manual start selection available.

## Goal

Design the WalkGraph v1 **free-first web/PWA** behavior for QR checkpoint generation, scan-based start positioning, printable QR outputs, and read-only offline building packages stored in the browser for basic offline search/routing.

This is a design-only contract for FR-005 and bounded FR-007. Product auth remains NextAuth/Auth.js; **oauth-router is only the agent/provider routing context**, not app authentication.

## Components

### Admin / Mapper

- **QR checkpoint manager:** list active checkpoints by building/floor/node; generate or reuse a stable active `QRCheckpoint`; label checkpoints; deactivate stale physical signs.
- **Printable QR output:** single-code and multi-code print views with QR image, building/floor/node labels, short code, instructions, and fallback URL.
- **Publish/offline readiness:** show whether the published graph has enough data for visitor routing and an offline package version.

### Visitor / PWA

- **QR deep-link landing:** opens public navigation, resolves checkpoint code, preselects start node, and asks for destination.
- **Offline package download/status:** published-building-only CTA showing current/stale/offline-ready state.
- **Offline package reader:** searches cached nodes and runs client-side routing from cached graph data. Visitor saved/recent places remain browser-local and do not require accounts.

### Server/API

- **QR generation:** current baseline `GET /api/qr/[nodeId]` creates/reuses an active checkpoint and returns `dataUrl`, `code`, and `qrData`.
- **QR resolution:** must resolve only active checkpoints whose building is published/public for visitors.
- **Offline package export:** current baseline `GET /api/buildings/[buildingId]/download` returns a published building snapshot with floors, nodes, edges, and active QR checkpoints.
- **Version provider:** prefer latest published `MapVersion`; otherwise generate a safe versioned response from current published records until publish snapshots are hardened.

## Data Flow

### QR Generation and Printing

1. Authenticated mapper/admin opens the building QR manager.
2. Mapper selects a valid node in the target building/floor.
3. Server verifies role authorization and node/building/floor integrity.
4. Server finds an active checkpoint for `nodeId`, or creates one with `buildingId`, `floorId`, `nodeId`, opaque `code`, optional `label`, and `active = true`.
5. Server builds `{NEXT_PUBLIC_APP_URL}/navigate/{buildingId}?node={checkpointCode}`.
6. Mapper prints and physically places the code at the mapped location.

### QR Scan / Start Positioning

1. Visitor scans a printed code.
2. Browser opens `/navigate/{buildingId}?node={checkpointCode}`.
3. App resolves the code online against active checkpoints, or offline against a cached package.
4. Resolution succeeds only if checkpoint exists, is active, matches `buildingId`, references an existing floor/node, and the building is published/public.
5. App preselects the resolved start node, asks for destination, then computes route from online graph or cached package.

### Offline Package Download and Use

1. Visitor opens a published building page.
2. Visitor taps **Download for offline use**.
3. Client requests `GET /api/buildings/{buildingId}/download` while online.
4. Server returns only published/client-safe package data.
5. Browser validates `schemaVersion`, `buildingId`, and `packageVersion`.
6. Browser stores full package in IndexedDB and a small registry in localStorage.
7. Online checks compare local version to latest published metadata.
8. Offline mode supports building resume, destination search, manual start, routing, and QR lookup only for cached active checkpoint codes.

## Database Schema Impact

No new database tables are required for v1.

### Existing Models Used

- `QRCheckpoint`: stable checkpoint identity, opaque `code`, `active` revocation gate, and building/floor/node links.
- `MapVersion`: preferred source for package version metadata and published `snapshotJson`.
- `Building`, `Floor`, `Node`, `Edge`: source graph data for online navigation and offline export.

### Required Build Hardening

- Enforce QR checkpoint building/floor/node consistency before create/update.
- QR generation requires `OWNER`, `ADMIN`, or `MAPPER` membership.
- Visitor QR resolution rejects draft, archived, private, inactive, missing, or cross-building checkpoints.
- Offline package endpoint returns only published/public, client-safe fields.
- Eventually enforce unique `(buildingId, versionNumber)` for `MapVersion` before relying on package comparisons.

### Explicit Non-Impact

- No Expo/native mobile implementation.
- No native SQLite.
- No server-backed visitor saved places in v1.
- No offline editing, robust sync, conflict resolution, or multi-device sync.

## Offline Package Schema

Package media type: JSON.

```json
{
  "schemaVersion": 1,
  "packageVersion": 3,
  "buildingId": "bld_123",
  "exportedAt": "2026-05-04T14:03:12.000Z",
  "publishedAt": "2026-05-04T13:55:00.000Z",
  "source": "mapVersion|generated",
  "building": {
    "id": "bld_123",
    "name": "Demo Campus Building",
    "slug": "demo-campus-building",
    "description": "Public visitor description",
    "address": "123 Campus Way",
    "latitude": 0,
    "longitude": 0,
    "category": "school"
  },
  "floors": [
    {
      "id": "floor_1",
      "buildingId": "bld_123",
      "name": "Ground Floor",
      "levelNumber": 0,
      "description": "Main visitor level",
      "accessibilityNotes": "Elevator near reception"
    }
  ],
  "nodes": [
    {
      "id": "node_1",
      "buildingId": "bld_123",
      "floorId": "floor_1",
      "name": "Main Entrance",
      "type": "ENTRANCE",
      "description": "Enter from the front courtyard",
      "x": 100,
      "y": 200,
      "searchable": true,
      "tags": ["entrance"],
      "aliases": ["front door"],
      "accessibilityFlags": ["step_free"],
      "restricted": false
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "buildingId": "bld_123",
      "fromNodeId": "node_1",
      "toNodeId": "node_2",
      "distanceEstimate": 12,
      "walkTimeEstimate": 18,
      "directionHint": "Walk past reception",
      "accessible": true,
      "requiresStairs": false,
      "requiresElevator": false,
      "requiresRamp": false,
      "restricted": false,
      "oneWay": false
    }
  ],
  "qrCheckpoints": [
    {
      "code": "ckpt_opaque_code",
      "label": "Main Entrance QR",
      "buildingId": "bld_123",
      "floorId": "floor_1",
      "nodeId": "node_1",
      "active": true
    }
  ],
  "searchIndex": [
    { "nodeId": "node_1", "terms": ["main entrance", "front door", "entrance"] }
  ]
}
```

### Client-Safe Field Rules

Include published building metadata, floor labels/order, accessibility notes, searchable/routable nodes, route edges, active QR checkpoint references, and version/export timestamps.

Exclude user records, organization members, credentials, env vars, drafts, private/archived buildings, inactive QR checkpoints, unpublished map versions, and future admin-only notes.

## Browser Storage and Version Strategy

- **IndexedDB** stores full packages; database `walkgraph-offline-v1`, store `buildingPackages`, key `{buildingId}`.
- **localStorage** stores only registry metadata under `walkgraph.offline.registry.v1`.
- `schemaVersion` changes for incompatible package shape changes.
- `packageVersion` changes whenever the published building graph/package changes.
- Store packages atomically after validating schema and building ID.
- When online, compare local `packageVersion` with latest published metadata and mark `current` or `stale`.
- Unsupported `schemaVersion` blocks offline use and prompts re-download.
- Browser-local saved/recent places can reference cached `buildingId`/`nodeId` without visitor accounts.

Registry example:

```json
{
  "packages": {
    "bld_123": {
      "buildingId": "bld_123",
      "name": "Demo Campus Building",
      "schemaVersion": 1,
      "packageVersion": 3,
      "downloadedAt": "2026-05-04T14:05:00.000Z",
      "publishedAt": "2026-05-04T13:55:00.000Z",
      "status": "current"
    }
  }
}
```

## QR URL and Code Format

Canonical v1 URL:

```text
{NEXT_PUBLIC_APP_URL}/navigate/{buildingId}?node={checkpointCode}
```

- `checkpointCode` is opaque and comes from `QRCheckpoint.code`; do not expose raw node IDs as QR identifiers.
- `buildingId` supports routing/package lookup, but resolver must still verify the checkpoint belongs to that building.
- Online resolution is authoritative server lookup.
- Offline resolution only uses active checkpoints included in the cached package.
- Inactive or missing codes show: “This checkpoint is no longer active. Choose your starting point manually.”

## Scanning Flow

1. User scans printed code with camera/OS scanner.
2. PWA opens `/navigate/{buildingId}?node={checkpointCode}`.
3. App checks connectivity.
4. Online: resolve checkpoint through server/public data fetch.
5. Offline: resolve checkpoint in cached package for `buildingId`.
6. If resolved, show checkpoint label, floor name, start node name, and destination search.
7. If unresolved, offer retry online, choose start manually, open downloaded building, or contact staff/admin.

## Printable Output

Each printed output includes:

- High-contrast black-on-white QR image.
- Building name.
- Floor name/level.
- Checkpoint/node label.
- Short checkpoint code for support.
- Instruction: “Scan to start indoor directions from here.”
- Optional placement note and fallback URL.

Print guidance:

- Minimum QR size around 35-45 mm for hallway scanning; larger for wall signage.
- Printed URL is public but should only identify a checkpoint.
- Deactivating a checkpoint invalidates old signs without deleting historical records.

## Failure States and Limitations

### Failure States

- Inactive or missing checkpoint: invalid/expired QR state plus manual start fallback.
- Checkpoint/building mismatch: reject and show invalid QR message.
- Building not published/public: reject visitor access.
- Node/floor deleted: reject checkpoint and prompt manual start.
- No route found: explain graph has no connected path for selected start/destination.
- Offline package missing: prompt reconnect or choose a downloaded building.
- Package stale: allow use with warning if schema compatible; recommend re-download.
- Unsupported schema: block offline use and require re-download.

### Limitations

- QR provides start positioning only; it is not real-time indoor GPS.
- No continuous recalibration unless the visitor scans another checkpoint.
- Offline mode is read-only.
- No robust sync, conflict resolution, offline editing, or native SQLite.
- No Expo/native mobile implementation is implied.
- No beacon, Wi-Fi fingerprinting, AR, LiDAR, compass, or step-count tracking required.
- Browser storage can be cleared by the browser/user or unavailable in private mode.
- Offline QR resolution can be stale until a new package is downloaded.
- Accessibility routing depends on admin-provided metadata.

## Test Cases / Regression Checks

### QR Checkpoints

- Authorized mapper/admin can generate QR for a valid node; response includes `dataUrl`, `code`, `qrData`, and node metadata.
- Regenerating QR for the same node reuses an active checkpoint rather than creating duplicate active codes.
- Unauthenticated/unauthorized users cannot generate QR checkpoints.
- QR link uses `NEXT_PUBLIC_APP_URL` and canonical `/navigate/{buildingId}?node={checkpointCode}` shape.
- Visitor QR resolution succeeds only for active checkpoints on published/public buildings.
- Inactive, missing, deleted-node, or cross-building checkpoint codes do not start navigation.

### Offline Package

- Download returns safe error for draft, archived, private, or missing buildings.
- Package includes only published/client-safe building, floors, nodes, edges, active QR checkpoints, and search data.
- Package excludes credentials, users, organization members, inactive QR checkpoints, unpublished versions, and server-only fields.
- Client validates `schemaVersion`, `buildingId`, and `packageVersion` before storing.
- Browser-local saved/recent places work without visitor accounts.
- Offline search finds nodes by name, aliases, tags, and type.
- Offline routing computes paths from cached edges and respects restricted/accessibility flags where implemented.
- Stale package warning appears when online metadata reports a newer `packageVersion`.
- Unsupported schema blocks offline use and asks for re-download.
- No test/copy implies Expo/native mobile, native SQLite, robust sync, or offline editing in v1.

## Build Task 13 Implementation Notes

Task 13 implements the v1 browser/PWA offline package path:

- `GET /api/buildings/[buildingId]/download` now returns schemaVersion `1` packages only for `PUBLISHED` + `PUBLIC` buildings, using explicit client-safe selects for building metadata, floors, searchable unrestricted nodes, unrestricted edges, active QR checkpoints, and a generated search index.
- Package version comes from the latest published `MapVersion` when present, with a generated `updatedAt` timestamp version fallback for published buildings without snapshots.
- Browser storage uses IndexedDB database `walkgraph-offline-v1`, object store `buildingPackages`, and localStorage registry key `walkgraph.offline.registry.v1`.
- Public building pages expose an account-free download/status/update/remove panel and detect stale local packages by comparing local and latest package versions.
- Public navigation and QR navigation can load cached packages, search cached nodes, resolve cached active checkpoint codes, and route with the shared Dijkstra rules while offline.
- Offline behavior remains read-only and browser-local; no native SQLite, robust sync, visitor accounts, or offline editing was added.

## Definition of Done for Build Tasks 12 and 13

- QR generation, scan/start flow, printable output, and deactivation behavior follow this contract.
- Offline package endpoint and browser storage use this schema/version strategy or a documented compatible variant.
- Public visitor behavior remains published-only and client-safe.
- Visitor saved/recent places remain browser-local in v1.
- Limitations are visible where users might expect live positioning or robust offline sync.
