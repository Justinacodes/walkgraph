# WalkGraph Takomi Orchestration Plan

Source brief: `docs/Walk Graph Mvp Project Brief.pdf`
Extracted text: `docs/Walk_Graph_Mvp_Project_Brief_extracted.txt`
Takomi session: `docs/tasks/orchestrator-sessions/orch-20260504-140312`

## Locked MVP Direction

WalkGraph v1 is a **web/PWA-only school/campus pilot**. The goal is to prove the node-first indoor navigation loop with the freest practical stack before adding native mobile, paid mapping SDKs, or hardware positioning.

### Free-First Stack

- Next.js App Router, TypeScript, Tailwind CSS, and the existing component style.
- Prisma with the existing Supabase/Postgres database.
- NextAuth/Auth.js for admin and mapper authentication.
- QR deep links for precise starting position.
- Browser storage, IndexedDB, Cache API, or localStorage for basic offline building packages.
- External map deep links for outdoor routing to the building.

### Deferred Until After Pilot

- Expo/native mobile app.
- Paid indoor/outdoor map SDKs unless needed for a real pilot constraint.
- AR arrows, Bluetooth beacons, Wi-Fi fingerprinting, LiDAR, 3D scanning, and real-time indoor GPS.
- Robust offline sync, conflict resolution, and multi-device offline editing.
- Required photo/floor-plan upload workflows beyond optional later polish.

## Orchestration Gates

| Gate | Name | Allowed Work | Exit Criteria |
| --- | --- | --- | --- |
| 1 | Design blueprints | Documentation only | Tasks 02-06 produce feature docs in `docs/features/`. |
| 2 | Owner approval | Review and revise docs | User confirms the blueprints are good enough to build. |
| 3 | Build sequence | Product code and docs | Tasks 07-13 run in dependency order and update feature docs as code changes. |
| 4 | Review and handoff | QA, seed data, release notes | Task 14 verifies the MVP against FR-001 through FR-008 and the brief. |

Build tasks are blocked until Gate 2 is complete. Agents must not treat task files as permission to code before the design blueprints are approved.

## Blueprint Outputs

| ID | Design Task | Required Output |
| --- | --- | --- |
| 02 | Scope reconciliation and MVP boundaries | `docs/features/00_Scope_Reconciliation.md` |
| 03 | Information architecture and screen map | `docs/features/01_Screen_Map.md` |
| 04 | Data model and API contract audit | `docs/features/02_Data_API_Audit.md` |
| 05 | Routing and human-readable instruction design | `docs/features/03_Routing_Instruction_Design.md` |
| 06 | Offline package and QR positioning design | `docs/features/04_Offline_QR_Design.md` |

Each blueprint must include Goal, Components, Data Flow, Database Schema impact, Regression Checks, and Approval Notes.

## Build Task Sequence

| ID | Build Task | Depends On | Blueprint Inputs |
| --- | --- | --- | --- |
| 07 | Foundation hardening and dependency/security cleanup | 02, 04, Gate 2 | 00, 02 |
| 08 | Auth, roles, organizations, and permissions | 02, 04, 07 | 00, 01, 02 |
| 09 | Building/floor/node/edge CRUD and graph editor | 03, 04, 08 | 01, 02 |
| 10 | Routing engine, route tester, and instructions | 04, 05, 09 | 02, 03 |
| 11 | Public visitor PWA search and navigation | 03, 05, 10 | 01, 03 |
| 12 | QR generation, scan/deep-link flow, and printable output | 06, 09, 11 | 01, 04 |
| 13 | Basic offline building package | 06, 10, 11 | 02, 03, 04 |
| 14 | Pilot polish, demo data, QA, and handoff | 07-13 | All blueprints |

## Whole-MVP Acceptance Criteria

- Admin can register/sign in and manage an organization.
- Organization owner/admin can create a school/campus building, floors, nodes, and edges.
- Mapper can create a multi-floor graph using manual node placement and edge creation.
- Admin can test routes before publishing.
- Visitor can search published buildings and indoor destinations.
- Visitor can start from manual selection or a QR checkpoint.
- App generates shortest-path routes with readable instructions.
- Accessible mode avoids stairs/restricted edges when a valid alternative exists.
- QR checkpoint links place the visitor at the correct building/floor/node.
- A published building can be downloaded for basic offline search and routing.

## Orchestration Rules

- Use Takomi workflows for every task; design tasks use `vibe-design`, build tasks use `vibe-build`, and final QA uses `mode-review` or `vibe-finalize`.
- Every task must read `docs/Project_Requirements.md`, the relevant `docs/issues/FR-XXX.md` files, and the required feature blueprints before making changes.
- Every major code change must update the matching feature doc.
- If a code file approaches 200 lines, stop and propose a split unless there is a clear written reason to keep it together.
- Keep all generated files inside this workspace unless the user approves an external write plan first.
- This project uses Prisma/Postgres, not Convex; do not run `pnpm convex deploy`.
