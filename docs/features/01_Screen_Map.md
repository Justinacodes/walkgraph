# Feature Blueprint: Information Architecture and Screen Map

## Goal

Define the build-ready screen architecture for WalkGraph v1 as a **mobile-first Next.js PWA** that supports:
- authenticated admin and mapper workspaces,
- public visitor wayfinding,
- QR-based route starts,
- published-building discovery,
- and basic offline package usage.

This blueprint locks the navigation structure for build tasks 09, 11, 12, and 13 so implementation does not need to invent page hierarchy, screen ownership, or flow boundaries later.

## Components

### Client Surfaces

#### 1. Auth Surface
- Register
- Login
- Session redirect into dashboard
- Protected-route fallback for unauthenticated users

#### 2. Admin / Owner Surface
- Dashboard home
- Organization list and create flow
- Organization detail
- Building creation flow
- Building detail / command center
- Publish controls
- Team and role management placeholder/future slot

#### 3. Mapper Surface
- Building floors manager
- Graph editor workspace
- Node creation and node editing panels
- Edge creation and edge metadata panels
- Route tester
- QR manager
- Accessibility review/editor

#### 4. Visitor PWA Surface
- Explore/search home
- Building detail and indoor search
- Start-point selection
- QR-start deep-link flow
- Route preview
- Turn-by-turn navigation
- Saved/recent start points in browser-local storage

#### 5. Offline Surface
- Download building package CTA
- Download status / version state
- Offline-ready badge on supported buildings
- Cached-building resume flow when connection is poor or absent

### Server / Data Providers
- Auth.js / NextAuth session endpoints
- Organization, building, floor, node, edge, route, search, publish, QR, and download route handlers
- Route-calculation service for route preview and navigation
- Published-building filtering for public surfaces
- Offline package export endpoint for read-only building snapshots

## Data Flow

### A. Auth and Protected Workspace
1. User opens `/auth/register` or `/auth/login`.
2. Successful authentication creates a session and redirects to `/dashboard`.
3. Dashboard queries organizations/buildings visible to the signed-in user.
4. Protected dashboard pages gate all admin/mapper actions behind membership and role checks.

### B. Organization to Building Setup
1. Owner/admin creates an organization from `/dashboard/organizations/new`.
2. Organization detail page becomes the building-launch point.
3. Owner/admin creates a building under an organization.
4. Building detail page becomes the hub for floors, graph editing, QR, routes, accessibility, and publication.

### C. Mapper Graph Creation
1. Mapper enters building workspace.
2. Mapper creates floors.
3. Mapper opens graph editor, selects a floor, adds nodes, then creates edges.
4. Mapper enriches nodes/edges with searchable labels, aliases, route hints, restrictions, and accessibility metadata.
5. Mapper tests routes, adjusts graph quality, and generates QR checkpoints.

### D. Public Discovery and Navigation
1. Visitor opens `/explore`.
2. Visitor searches published buildings only.
3. Visitor opens `/explore/[buildingId]`.
4. Visitor picks destination and starting method.
5. Route preview requests shortest path for the selected building graph.
6. Navigation view renders instructions, floor changes, and route context.

### E. QR Start Flow
1. Visitor scans a QR code or opens QR deep link.
2. App lands on `/navigate/[buildingId]?node={checkpointCode}`.
3. QR code resolves to an active checkpoint and concrete node.
4. Start node is prefilled; visitor only chooses destination.
5. App generates route and enters navigation.

### F. Offline Flow
1. Visitor views a published building with offline support.
2. User downloads the building package from the building detail / route entry surface.
3. Package stores building metadata, floors, nodes, edges, QR references, and search aliases in browser-local storage/IndexedDB.
4. When online, app compares local version with latest published package metadata.
5. When offline, visitor can reopen a downloaded building, search locally, choose start/destination, and compute routes from cached graph data.

## Database Schema Impact

This screen map does not itself require new tables, but it confirms UI dependency on these entities:
- `User`
- `Organization`
- `OrganizationMember`
- `Building`
- `Floor`
- `Node`
- `Edge`
- `QRCheckpoint`
- `MapVersion`
- optional future `SavedPlace` server model, while v1 defaults to browser-local saved/recent places

### Screen-Driven Field Expectations
- **Organization**: name, slug, logo, contact/visibility basics for admin display.
- **Building**: name, address/description, lat/long, status, visibility, offline-available flag or inferred exportability, main entrance reference.
- **Floor**: name, level number, optional description, optional accessibility notes.
- **Node**: name, type, searchable, tags, aliases, floor reference, optional x/y, checkpoint eligibility, restricted/accessibility flags.
- **Edge**: from/to nodes, direction hints, distance/walk time, stairs/elevator/ramp flags, restricted, one-way, accessible metadata.
- **QRCheckpoint**: active state, label/code, building/floor/node linkage.
- **MapVersion**: version number, publish metadata, package freshness checks for offline.

### Non-Impact Guardrails
- No Expo/native screen assumptions.
- No SQLite-native mobile editing model.
- No real-time indoor positioning tables.
- No required server-side visitor accounts for saved places in v1.

## Screen Groups

## 1. Authentication and Session Screens

### `app/auth/register/page.tsx` — Register
**Purpose:** Create admin/owner/mapper accounts for protected workspaces.

**Primary users:** owner, admin, mapper

**Key components:**
- registration form
- validation and error states
- link to login
- post-submit redirect to dashboard

**FR mapping:**
- FR-001 primary

### `app/auth/login/page.tsx` — Login
**Purpose:** Start authenticated sessions for protected dashboard access.

**Primary users:** owner, admin, mapper

**Key components:**
- credential form
- auth error state
- register link
- redirect to intended dashboard route after success

**FR mapping:**
- FR-001 primary

### Session / Route Guard State
**Purpose:** Redirect unauthenticated users away from dashboard routes.

**Primary users:** owner, admin, mapper

**Key components:**
- loading state
- redirect pattern
- unauthorized messaging

**FR mapping:**
- FR-001 primary

## 2. Dashboard and Organization Screens

### `app/dashboard/page.tsx` — Dashboard Home
**Purpose:** First signed-in overview and launch point into organizations/buildings.

**Primary users:** owner, admin, mapper

**Key components:**
- summary of accessible organizations/buildings
- quick actions
- recent building work
- empty state for first-time setup

**FR mapping:**
- FR-001 support
- FR-002 primary

### `app/dashboard/organizations/page.tsx` — Organizations List
**Purpose:** Show organizations the user can access and route into organization workspaces.

**Primary users:** owner, admin, mapper

**Key components:**
- organization cards/list
- role badge per org
- create organization CTA
- empty state

**FR mapping:**
- FR-001 support
- FR-002 primary

### `app/dashboard/organizations/new/page.tsx` — Create Organization
**Purpose:** Create a new owning container for buildings and team membership.

**Primary users:** owner/admin

**Key components:**
- organization form
- optional logo/contact fields
- success redirect to organization detail

**FR mapping:**
- FR-002 primary

### `app/dashboard/organizations/[orgId]/page.tsx` — Organization Detail
**Purpose:** Manage organization-level building inventory and eventually team settings.

**Primary users:** owner, admin

**Key components:**
- org header
- buildings list
- new building modal/CTA
- member/team summary block
- role-aware actions

**FR mapping:**
- FR-002 primary
- FR-006 support
- Team management is future unless already implemented beyond basic membership display

### Future: Team / Roles Screen
**Purpose:** Manage owner/admin/mapper/viewer assignments with clearer UI.
