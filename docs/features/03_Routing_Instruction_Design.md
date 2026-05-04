# Feature Blueprint: Routing and Human-Readable Instructions

## Goal

Define how WalkGraph calculates indoor routes and turns graph paths into clear, human-readable campus navigation instructions.

## Components

### Client
- Admin route tester for validating routes before publishing.
- Visitor route preview and step-by-step navigation.
- Accessibility toggle for avoiding stairs and restricted paths when possible.

### Server
- Graph builder that loads nodes and edges for a building.
- Dijkstra-style routing engine using distance or walk-time weights.
- Instruction builder that combines node names, node types, floor changes, and edge direction hints.

## Data Flow

1. Client sends building, start node, destination node, and route preferences.
2. Server loads the building graph and filters restricted or inaccessible edges.
3. Routing engine returns path nodes, path edges, total distance/time estimate, and instructions.
4. Client displays route summary, floor changes, and step-by-step guidance.

## Database Schema

Use existing `Node` and `Edge` fields:
- `Node.type`, `Node.name`, `Node.floorId`, `Node.accessibilityFlags`, `Node.restricted`.
- `Edge.distanceEstimate`, `Edge.walkTimeEstimate`, `Edge.directionHint`, `Edge.accessible`, `Edge.requiresStairs`, `Edge.requiresElevator`, `Edge.requiresRamp`, `Edge.restricted`, `Edge.oneWay`.

If instruction quality requires new fields, document them in `02_Data_API_Audit.md` before changing schema.

## Routing Rules

- Default route prioritizes shortest practical walkable path.
- Accessible route must avoid stairs and restricted edges when a valid alternative exists.
- Vertical movement is represented by connected staircase, elevator, or ramp nodes across floors.
- Edge `directionHint` should override generic generated instruction text.
- No route should return if start or destination is missing, unpublished, or outside the same building graph.

## Regression Checks

- Cross-check with FR-004 and FR-008.
- Confirm route tester and visitor routes use the same routing behavior.
- Confirm no route uses restricted edges by default.
- Confirm multi-floor paths include floor-change instructions.

## Approval Notes

This design must be approved before changing routing code or visitor navigation behavior.
