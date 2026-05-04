# Feature Blueprint: Data Model and API Contract Audit

## Goal

Audit the existing Prisma schema and route handlers against the MVP brief before build work, treating current implementation as the baseline rather than starting from scratch.

## Components

### Client
- Forms and editors consume typed validation contracts for organizations, buildings, floors, nodes, edges, QR, search, routing, and downloads.
- Visitor screens consume public, published-only APIs.

### Server
- Prisma models remain the source of truth.
- Route handlers must validate input with Zod or existing validation helpers.
- Admin and mapper routes must enforce organization membership and role permissions.
- Public routes must only expose published building data.

## Data Flow

1. Authenticated admin or mapper sends validated mutations to API routes.
2. API checks session and organization/building access before writing.
3. Public visitor requests read from published buildings only.
4. Route and download APIs read graph data and return minimal client-safe payloads.

## Database Schema

Baseline models: `User`, `Organization`, `OrganizationMember`, `Building`, `Floor`, `Node`, `Edge`, `QRCheckpoint`, `SavedPlace`, and `MapVersion`.

Audit focus:
- Whether `MapVersion.snapshotJson` is enough for basic offline packages.
- Whether QR codes need status, label, and node relation only, or additional scan metadata later.
- Whether saved places should stay browser-local for v1.
- Whether indexes or uniqueness constraints are needed for search, slugs, and graph integrity.

## API Contract Areas

- Auth and registration.
- Organizations and membership.
- Buildings and publication.
- Floors, nodes, and edges.
- Search and route calculation.
- QR generation and deep-link lookup.
- Building download/offline package.

## Regression Checks

- Compare API coverage to FR-001 through FR-008.
- Reject cross-building node and edge relationships.
- Confirm private/draft buildings do not leak through public APIs.
- Confirm no Supabase service secrets are exposed to client code.

## Approval Notes

This audit must be approved before schema migrations or route handler changes. Any schema change should be documented here before implementation.
