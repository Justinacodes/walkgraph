# Feature Blueprint: Routing and Human-Readable Instructions

## Goal

Define the routing contract for WalkGraph v1 so admin route testing, visitor navigation, QR-start navigation, and offline package routing share one deterministic rule set: shortest practical route by default, accessibility-aware routing on request, explicit floor changes, and human-readable indoor directions.

Provider note: `oauth-router` is only the provider/model-routing context for this task. It is not app authentication; product auth remains NextAuth/Auth.js.

## Components

- **Admin route tester:** authorized owners/admins/mappers can test draft or published building routes before publication.
- **Visitor navigation:** public users can route only through published/public building graph data.
- **QR checkpoint start:** scanned checkpoint resolves to a start node, then uses the same route service as manual start selection.
- **Shared routing service:** graph builder + Dijkstra + instruction generator used by tester, visitor API, and offline package logic.
- **Accessibility option:** asks for step-free/mobility-aware routes and clearly warns when metadata is incomplete.
- **No-route states:** explain unreachable, restricted-only, stairs-only-accessibility, unpublished, and invalid graph cases.

## Data Flow

1. Caller submits `buildingId`, `startNodeId`, `destinationNodeId`, and preferences such as `accessibilityMode`.
2. API validates IDs and building visibility: admin tester may use draft if authorized; visitor routes may use only published/public buildings.
3. Graph builder loads one-building node, edge, and floor DTOs; invalid cross-building or missing references are rejected or surfaced to admin tester.
4. Routing applies eligibility filters, Dijkstra weights, and tie-breakers.
5. Instruction generation converts path edges to steps using `directionHint` first, then generated templates.
6. Client displays summary, warnings, grouped floor sections, and step-by-step instructions.
7. Offline packages must contain enough node/edge/floor fields to reproduce the same route and instruction behavior.

## Database Schema Impact

No v1 schema change is required if existing DTOs expose:

- `Node`: `id`, `buildingId`, `floorId`, `name`, `type`, `x`, `y`, `searchable`, `tags`, `aliases`, and `restricted` if present.
- `Edge`: `id`, `buildingId`, `fromNodeId`, `toNodeId`, `distanceEstimate`, `walkTimeEstimate`, `directionHint`, `accessible`, `requiresStairs`, `requiresElevator`, `requiresRamp`, `restricted`, `oneWay`.
- `Floor`: `id`, `buildingId`, `name`, and `levelNumber` or equivalent display order.

Build hardening must enforce same-building node/edge references, public-safe visitor payloads, restricted data exclusion, and floor metadata availability for multi-floor instructions.

## Routing Rules

### Shared Contract

- Route tester and visitor navigation use the same route rules; only authorization/visibility and data source differ.
- Routing is node-to-node inside one building. Outdoor routing remains an external map link.
- Restricted edges are excluded by default for all public and tester calculations.

### Eligibility Filters

1. `restricted=true` edges are excluded in all default v1 routes.
2. Restricted nodes cannot be public starts, destinations, or intermediate nodes. Admin tester should warn if selected.
3. `oneWay=true` edges are usable only from `fromNodeId` to `toNodeId`; `oneWay=false` edges are bidirectional.
4. Default mode may use stairs, elevators, and ramps.
5. Accessibility mode avoids stairs whenever any valid non-stair alternative exists and must never silently return a stair route as accessible.
6. Accessibility mode prefers `accessible=true` edges. Unknown/inaccessible non-stair edges may be used only as a fallback with an explicit warning.
7. Cross-building edges, missing endpoints, negative weights, and unflagged cross-floor edges are invalid graph issues.

### Routing Weights

Base weight priority: `walkTimeEstimate` when present, else `distanceEstimate`, else default cost `10`.

| Condition | Default Mode | Accessibility Mode |
| --- | ---: | ---: |
| Restricted edge | Exclude | Exclude |
| Stairs | +20 | Exclude in strict pass; no accessible route if only option |
| Elevator | +30 | +15 |
| Ramp | +5 | +0 |
| `accessible=false` or unknown | +0 unless otherwise flagged | Exclude in strict pass; fallback only with warning |
| Floor change | Cost comes from vertical edge penalties | Cost comes from eligible elevator/ramp penalties |

Accessibility mode should run a strict pass first: exclude restricted, stairs, and inaccessible/unknown edges. If no path exists, a fallback pass may allow unknown non-stair accessibility metadata with a warning. It must not fall back to stairs.

### Tie-Breakers

For equal or near-equal total cost, prefer: fewer warnings, fewer floor changes, fewer vertical transitions, fewer steps, more `accessible=true` edges in accessibility mode, more `directionHint` edges, then stable lexical edge/node ID order.

## Multi-Floor Behavior

- Multi-floor movement is represented by edges between floor nodes, normally staircase, elevator, or ramp nodes.
- Every cross-floor edge must be flagged `requiresStairs`, `requiresElevator`, or `requiresRamp`, or be between nodes whose types clearly indicate those vertical connectors.
- Unflagged cross-floor edges fail publication validation and surface in route tester.
- Every floor change instruction must name the target floor when available: “Take the elevator to Floor 2.”
- If floor names are unavailable, the instruction must still say “change floors” and include the target node.
- Accessibility routes may change floors only via elevators/ramps or verified accessible connectors, never stairs.

## Instruction Patterns

### Precedence

1. Non-empty edge `directionHint`, trimmed and used verbatim. For floor changes, append target floor context only if missing.
2. Vertical transition template for stairs/elevator/ramp or `from.floorId !== to.floorId`.
3. Node-type/landmark template.
4. Generic fallback: “Walk to {toNode.name}.”

### Templates

- Start: “Start at {fromNode.name}.”
- Normal segment: “Walk to {toNode.name}.”
- Corridor/landmark: “Continue toward {toNode.name}.”
- Final destination: “Arrive at {toNode.name}.”
- Stairs: “Take the stairs to {targetFloorName}, then continue to {toNode.name}.”
- Elevator: “Take the elevator to {targetFloorName}, then exit toward {toNode.name}.”
- Ramp: “Use the ramp to reach {targetFloorName or toNode.name}.”
- Accessibility success: “This route avoids stairs and restricted paths.”
- Accessibility fallback: “No fully verified accessible route was found; this route may include segments without confirmed accessibility metadata.”

Quality rules: use names over coordinates, avoid compass-only language unless in `directionHint`, never direct users through restricted areas, keep steps mobile-readable, and preserve all floor-change/landmark steps even if UI later groups corridor steps.

## Edge Cases

- Start equals destination: return “You are already at {node}.”
- Missing or outside-building start/destination: validation error.
- Unreachable destination: no-route state suggesting another start or admin graph review.
- Only restricted path exists: no route by default.
- Only stair path exists in accessibility mode: no accessible route.
- Only unknown accessibility path exists: fallback route with warning only; no silent success.
- Reverse traversal of a one-way-only path: no route or valid detour.
- Duplicate parallel edges: allowed only if meaningful; lowest eligible weight wins.
- Draft/private visitor route: reject as unavailable/not found.
- Offline stale package: route may proceed with version/staleness warning if known.

## Test Scenarios and Acceptance Cases

### Admin Route Tester

1. Same-floor route chooses lowest total weight.
2. Equal-weight routes use deterministic tie-breakers.
3. Restricted edge is not used even when shorter.
4. One-way edge succeeds forward and fails/detours backward.
5. Missing edge endpoint and unflagged cross-floor edge surface as validation issues.
6. `directionHint` appears verbatim in generated steps.
7. Draft building test requires authorized owner/admin/mapper.

### Visitor Navigation

1. Public routing works only for published/public buildings.
2. Destination routing targets searchable nodes.
3. QR start and manual start return identical results for identical options.
4. Unreachable and already-at-destination states are clear.
5. Multi-floor route includes explicit floor-change instruction and target floor.

### Accessibility Routing

1. Avoids stairs when elevator/ramp alternative exists.
2. Uses longer elevator/ramp path over shorter stairs path.
3. Returns no accessible route when stairs are the only connector.
4. Excludes restricted edges.
5. Unknown accessibility fallback includes warning.
6. Default mode may use stairs but still excludes restricted edges.

### Offline Package Routing

1. Package includes node, edge, and floor fields needed to match server routing.
2. Offline routing uses the same weights, filters, tie-breakers, and instruction precedence.
3. Offline package never exposes draft/private buildings.

## Regression Checks

- Route tester and visitor navigation use the same routing behavior.
- Restricted edges are not used by default.
- Accessible mode avoids stairs when a valid alternative exists.
- Multi-floor routes produce explicit floor-change instructions.
- `directionHint` precedence is preserved.
- Public visitor routing never exposes draft/private graph data.

## Build Task 10 Implementation Notes

Implemented in `lib/routing/*`, `app/api/route/route.ts`, and the admin route tester:

- Dijkstra routing excludes restricted nodes/edges, honors one-way edges, rejects invalid/unflagged cross-floor edges, and uses deterministic edge/node ordering for equal-cost paths.
- Accessibility mode runs a strict stair-free/accessibility-confirmed pass first, then allows non-stair fallback segments marked `accessible=false` only with an explicit warning.
- Multi-floor route steps include `floorChange`, `targetFloorName`, and vertical connector instructions for stairs, elevators, ramps, or generic floor changes.
- The route API separates `visitor` and `admin` contexts: visitors only route published/public buildings and searchable unrestricted nodes; admin route testing requires map-edit access.
- The route tester posts with admin context, displays accessibility/fallback warnings, already-at-destination states, floor-change counts, and vertical step badges.

## Build Task 11 Hardening Notes

The public visitor surfaces now consume the existing visitor route contract more defensively:

- Public building detail and QR navigation reject non-public or unpublished buildings.
- Public search returns only published/public buildings and unrestricted searchable nodes.
- Visitor destination/manual-start selection matches names, descriptions, aliases, tags, and floor labels.
- Visitor route UI now handles `ALREADY_THERE`, accessibility success/fallback warnings, unreachable states, and floor-change badges without diverging from admin route rules.

## Definition of Done for Build Task 10

Build task 10 implemented routing and instruction hardening without changing core rules; edge cases above are documented; verification passed for TypeScript, lint, and production build via `python scripts/vibe-verify.py`.
