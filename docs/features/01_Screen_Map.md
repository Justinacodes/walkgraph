# Feature Blueprint: Information Architecture and Screen Map

## Goal

Define the screens and flows for a mobile-first web/PWA school/campus pilot covering admin setup, mapper graph creation, visitor navigation, QR starts, and basic offline management.

## Components

### Client
- Landing and explore pages.
- Auth pages for register/login.
- Dashboard shell with organization, building, floor, node, edge, QR, route test, accessibility, and publish areas.
- Visitor PWA screens for building detail, destination search, start selection, route preview, navigation steps, QR start, and offline download status.

### Server
- API routes provide the data for each screen.
- Server components should fetch protected dashboard data where practical.
- Client components should be reserved for interactive graph editing, route testing, QR management, and navigation state.

## Data Flow

1. Admin auth flow leads into dashboard.
2. Dashboard lists organizations and buildings.
3. Building workspace branches into floors, graph editor, QR manager, accessibility, route tester, and publish settings.
4. Public visitor flow starts at explore/search, opens a published building, chooses destination and start node, then displays route steps.
5. QR link opens directly into the visitor navigation flow with the start node preselected.

## Database Schema

No schema changes should be made from this blueprint alone. Screen design should reference existing models and identify any missing fields in `02_Data_API_Audit.md`.

## Required Screen Groups

- Admin: organization list, organization detail, building creation, building detail, publish controls.
- Mapper: floor manager, graph editor, node editor, edge editor, QR manager.
- Visitor: explore/search, building detail, start picker, destination picker, route preview, step-by-step navigation.
- Offline: download building, cached package status, use cached data when offline.

## Regression Checks

- Every required screen must map to at least one FR in `docs/Project_Requirements.md`.
- Avoid marketing-only pages where a usable app screen is needed.
- Keep web/PWA only; do not introduce Expo screens.

## Approval Notes

The screen map should be approved before UI build work begins. Any screen not needed for the school/campus pilot should be marked future.
