# WalkGraph Builder Handoff Report

**Date:** 2026-05-06  
**Takomi session:** `orch-20260504-140312`  
**Task:** 14 — Pilot polish, school/campus demo data, QA, and handoff  
**Status:** MUS/pilot handoff complete after verification

## Built / Verified Feature Coverage

| FR | Coverage status | Notes |
| --- | --- | --- |
| FR-001 Auth and sessions | Complete | Credentials registration/login, password hashing, protected dashboard, session-aware routes. |
| FR-002 Organizations/buildings | Complete | Owner/admin organization and building management with membership/role authorization. |
| FR-003 Graph editor | Complete | Floors, nodes, edges, coordinates, metadata, floor plan uploads, and same-building guards. |
| FR-004 Routing/navigation | Complete | Shared Dijkstra routing, admin tester, public navigation, destination/manual-start search, already-there/no-route states. |
| FR-005 QR checkpoints | Complete | Authorized QR generation, printable output, canonical public links, active/inactive handling, full and short manual-code resolution online/offline. |
| FR-006 Publication/discovery | Complete | Public explore only lists `PUBLISHED` + `PUBLIC` buildings; publication readiness checks block incomplete graphs. |
| FR-007 Basic offline export | Complete for v1 | Public package download is account-free for published public buildings; browser storage and offline routing/search are read-only. |
| FR-008 Basic accessibility routing | Complete for v1 | Accessible route option avoids stairs/restricted paths, exposes warnings/no-route states, and uses keyboard-accessible controls. |

## Pilot Polish and P1 Fixes Completed

- Added shared building graph read-access helper to separate member access from public-safe reads.
- Hardened floor/node/edge read APIs so logged-in non-members do not receive private/restricted graph details from published public buildings.
- Removed `/api/buildings/:path*` from auth middleware so the published/public offline download endpoint can be used by visitors; mutation routes still enforce authorization internally.
- Added publish-readiness validation: at least one floor, at least two searchable unrestricted nodes, at least one routable edge, valid endpoints, and flagged cross-floor connectors.
- Added user-facing publish error display.
- Preserved non-searchable unrestricted transit nodes in offline packages for pathfinding, while hiding them from offline public search/start/destination selection.
- Enforced offline start/destination parity with online public routing (`searchable && !restricted`).
- Added offline short-code QR resolution to match printed manual QR fallback behavior.
- Replaced visitor accessibility toggles with keyboard/screen-reader operable checkbox controls.
- Added basic in-memory rate limiting to registration, route, search, upload, and offline download endpoints.
- Restricted floor-plan uploads to PNG/JPG/WebP, added floor/building map-edit authorization, and removed SVG uploads.

## Demo Seed / Data Setup

Manual school/campus demo seed instructions are documented in:

- `docs/Demo_Seed_Data.md`

Recommended demo path:

1. Register a demo admin.
2. Create **Demo Campus School** and **Demo Campus Main Building**.
3. Add Ground Floor and Second Floor.
4. Add entrance, reception, corridor, restroom, elevator, stair, lecture room, library, office, and classroom nodes.
5. Add accessible elevator paths and separate stair paths.
6. Generate QR checkpoints for Main Entrance, Reception, Elevator Ground, and Library.
7. Test Main Entrance → Library in default and accessible modes.
8. Publish, open `/explore`, download the offline package, then simulate offline mode.

## End-to-End QA Checklist

- [x] Register/login/logout and dashboard protection reviewed.
- [x] Organization/building role boundaries reviewed.
- [x] Dashboard building layout now denies unauthorized building access via layout-level member check.
- [x] Graph API read boundaries reviewed for unauthenticated users, members, and logged-in non-members.
- [x] Public explore and navigate pages are published/public-only.
- [x] Route API validates building visibility, start/destination membership, searchable public nodes, restricted nodes, inaccessible/stair routes, already-there, and no-route states.
- [x] QR generation requires map-edit access; visitor QR resolution requires active checkpoint on a published public building.
- [x] Printed short QR manual codes resolve online and offline.
- [x] Offline package endpoint exports client-safe published data only.
- [x] Offline search exposes only searchable unrestricted nodes while retaining transit nodes for pathfinding.
- [x] Accessibility route controls are keyboard-operable checkboxes with focus indication.
- [x] Responsive sanity reviewed for mobile-first explore, navigate, dashboard tab scrolling, and QR/mobile route screens.

## Security / Regression Review Summary

- No P0/P1 blockers remain after `oauth-router/gpt-5.5` high read-only re-review.
- Remaining moderate dependency advisory: `next-auth@4.24.10` transitive `uuid@8.3.2`; logged in `docs/features/10_Build_Baseline.md`. Do not force override without NextAuth compatibility testing.
- Rate limiting is in-memory and suitable only as a basic pilot safeguard; production should use Redis/Upstash/database-backed limits.
- Public download/search/route endpoints avoid draft/private building exposure.
- SVG upload was removed from allowed floor-plan uploads to reduce XSS/storage risk.

## Verification Status

Final verification command:

```bash
python scripts/vibe-verify.py
```

Result: **PASS**

- TypeScript: PASS (`pnpm exec tsc --noEmit`)
- Lint: PASS (`pnpm run lint`)
- Build: PASS (`pnpm run build`)

Final deep review:

- `pi --model oauth-router/gpt-5.5 --thinking high ...`
- Result: **PASS — no P0/P1 blockers found**

## How to Run

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev
```

Required environment variables are listed in `.env.example`. Minimum local setup needs:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- Supabase storage values if floor-plan uploads are used

## Deployment Notes

- Use Postgres/Supabase for `DATABASE_URL`; run Prisma generate and schema push/migrations before first deployment.
- Set `NEXT_PUBLIC_APP_URL` to the production origin so QR codes point at the deployed app.
- Configure Supabase bucket `floor-plans` as intended for public floor-plan image serving.
- Browser offline packages depend on IndexedDB/localStorage availability and can be cleared by the browser/user.
- Replace in-memory rate limits with a shared production rate-limit store before multi-instance deployment.

## Known Limitations / Future Work

- No native mobile app, AR, beacons, LiDAR, live indoor positioning, or robust offline sync.
- Offline mode is read-only and browser-local; there is no offline editing or conflict resolution.
- Accessibility routing depends on mapper-entered edge/node metadata and is not a certified accessibility audit.
- `GraphEditor.tsx` remains large and should be decomposed in a future refactor.
- Team management UI remains minimal; role membership exists in the data model/permissions layer.
- Automated Prisma seed script is not implemented; use `docs/Demo_Seed_Data.md` for pilot setup.
