# Master Plan: WalkGraph MVP Takomi Orchestration

**Session ID:** orch-20260504-140312
**Runtime Mode:** hybrid
**Session Intent:** full-project
**Pilot Target:** web/PWA-only school/campus MVP with basic offline building packages

## Gates

| Gate | Status | Tasks | Rule |
| --- | --- | --- | --- |
| Gate 1: Design blueprints | completed | 02-06 | Documentation only; no product code changes. |
| Gate 2: Owner approval | completed | approval checkpoint | Owner approved the blueprints and authorized build to proceed. |
| Gate 3: Build sequence | in-progress | 07-13 | Implement in dependency order and update feature docs while coding. |
| Gate 4: Review and handoff | blocked | 14 | Verify FR coverage, demo data, QA, and handoff notes. |

## Lifecycle

### Genesis
- Status: completed
- Tasks: 01
- Output: PRD, issues, coding guidelines, builder prompt, initial Takomi session

### Design
- Status: completed
- Tasks: 02, 03, 04, 05, 06
- Required outputs:
  - `docs/features/00_Scope_Reconciliation.md`
  - `docs/features/01_Screen_Map.md`
  - `docs/features/02_Data_API_Audit.md`
  - `docs/features/03_Routing_Instruction_Design.md`
  - `docs/features/04_Offline_QR_Design.md`

### Build
- Status: in-progress
- Tasks: 07, 08, 09, 10, 11, 12, 13
- Gate 2 approval received; task 07 completed and task 08 is next.

### Review
- Status: blocked
- Tasks: 14
- Blocker: completion of tasks 07-13

## Model Routing

Provider: `oauth-router`.

Detailed routing policy: `docs/Model_Routing_Strategy.md`.

- `oauth-router/gpt-5.5`: senior brain for architecture, security, complex debugging, cross-file risk, final/deep review.
- `oauth-router/gpt-5.4`: default workhorse for normal coding, planning, UI logic, implementation, debugging, and review.
- `oauth-router/gpt-5.4-mini`: fast junior implementer for small, explicit, isolated edits only.

Before sub-agent dispatch or model override, run and surface `pi --list-models`.

## Tasks

| ID | Gate | Stage | Title | Status | Role | Workflow | Required Skills |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | Genesis | genesis | Genesis foundation | completed | orchestrator | vibe-genesis | takomi |
| 02 | Gate 1 | design | Scope reconciliation and MVP boundaries | completed | architect | vibe-design | takomi, avoid-feature-creep |
| 03 | Gate 1 | design | Information architecture and screen map | completed | design | vibe-design | takomi, frontend-design |
| 04 | Gate 1 | design | Data model and API contract audit | completed | architect | vibe-design | takomi, nextjs-standards |
| 05 | Gate 1 | design | Routing and human-readable instruction design | completed | architect | vibe-design | takomi, nextjs-standards |
| 06 | Gate 1 | design | Offline package and QR positioning design | completed | architect | vibe-design | takomi, nextjs-standards |
| 07 | Gate 3 | build | Foundation hardening and dependency/security cleanup | completed | code | vibe-build | takomi, nextjs-standards |
| 08 | Gate 3 | build | Auth, roles, organizations, and permissions | pending | code | vibe-build | takomi, nextjs-standards |
| 09 | Gate 3 | build | Building/floor/node/edge CRUD and graph editor | blocked | code | vibe-build | takomi, nextjs-standards, frontend-design |
| 10 | Gate 3 | build | Routing engine, route tester, and instructions | blocked | code | vibe-build | takomi, nextjs-standards |
| 11 | Gate 3 | build | Public visitor PWA search and navigation | blocked | code | vibe-build | takomi, nextjs-standards, frontend-design |
| 12 | Gate 3 | build | QR generation, scan/deep-link flow, and printable output | blocked | code | vibe-build | takomi, nextjs-standards |
| 13 | Gate 3 | build | Basic offline building package | blocked | code | vibe-build | takomi, nextjs-standards |
| 14 | Gate 4 | review | Pilot polish, school/campus demo data, QA, and handoff | blocked | review | mode-review | takomi, nextjs-standards |

## Dependency Map

```mermaid
flowchart TD
  T01["01 Genesis"] --> T02["02 Scope"]
  T01 --> T03["03 Screen Map"]
  T01 --> T04["04 Data/API"]
  T02 --> T05["05 Routing Design"]
  T04 --> T05
  T03 --> T06["06 Offline/QR Design"]
  T04 --> T06
  T02 --> A["Gate 2 Owner Approval"]
  T03 --> A
  T04 --> A
  T05 --> A
  T06 --> A
  A --> T07["07 Foundation"]
  T07 --> T08["08 Auth/Roles"]
  T08 --> T09["09 Graph Editor"]
  T09 --> T10["10 Routing Engine"]
  T10 --> T11["11 Visitor PWA"]
  T09 --> T12["12 QR Flow"]
  T11 --> T12
  T10 --> T13["13 Offline Package"]
  T11 --> T13
  T12 --> T14["14 QA/Handoff"]
  T13 --> T14
```

## Notes

- Human-readable task docs live in this session folder.
- Machine state lives in `.pi/takomi/orchestrator/orch-20260504-140312.json`; task docs are the source of truth for this revised handoff.
- Gate 2 owner approval was received; build is now in progress.
- This project appears to use Prisma/Postgres, not Convex; do not run `pnpm convex deploy`.
