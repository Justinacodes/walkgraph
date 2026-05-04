# Feature Blueprint: Offline Package and QR Positioning

## Goal

Design a free-first web/PWA approach for QR-based starting position and basic offline building packages.

## Components

### Client
- QR checkpoint manager for admins/mappers.
- Printable QR output for important nodes.
- Visitor QR deep-link start flow.
- Offline download/status UI for published buildings.
- Browser-side cached building package reader.

### Server
- QR generation endpoint that creates stable node checkpoint links.
- Public QR lookup/deep-link route.
- Building download endpoint that returns a published, client-safe graph package.

## Data Flow

1. Mapper selects important nodes and generates QR checkpoints.
2. System creates printable QR codes that link to a building and node.
3. Visitor scans QR and opens the PWA with building and start node preselected.
4. Visitor downloads a published building package.
5. When offline, browser uses the cached package for search and route calculation where possible.

## Database Schema

Use existing `QRCheckpoint` for QR identity and node relation. Use `MapVersion.snapshotJson` or a generated download response for offline packages.

Browser-local saved places and cached packages should not require a user account in v1.

## QR Link Shape

The exact URL format should be finalized during implementation, but it must include enough information to resolve:
- Building.
- Floor.
- Node/checkpoint.
- Active/inactive checkpoint status.

Prefer opaque checkpoint codes over exposing sensitive internal assumptions.

## Offline Package Contents

- Building metadata.
- Floors.
- Nodes.
- Edges.
- QR checkpoint references.
- Search aliases/tags.
- Version or published timestamp.

Do not include private drafts, secrets, service credentials, or unpublished buildings.

## Regression Checks

- Cross-check with FR-005 and FR-007.
- QR links must not start navigation for inactive or missing checkpoints.
- Offline package must be published-only and client-safe.
- Basic offline does not include sync conflicts, offline editing, or native SQLite.

## Approval Notes

This design must be approved before implementing QR scan/deep-link behavior or offline caching.
