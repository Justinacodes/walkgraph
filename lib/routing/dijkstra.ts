import type { GraphNode, GraphEdge, RouteOptions, RouteResult, RouteStep } from "./types";

interface AdjEntry {
  toNodeId: string;
  weight: number;
  edge: GraphEdge;
}

function buildAdjacency(
  edges: GraphEdge[],
  options: RouteOptions
): Map<string, AdjEntry[]> {
  const adj = new Map<string, AdjEntry[]>();

  for (const edge of edges) {
    if (edge.restricted) continue;
    if (options.accessibilityMode && edge.requiresStairs) continue;

    const weight = edgeWeight(edge, options);

    if (!adj.has(edge.fromNodeId)) adj.set(edge.fromNodeId, []);
    adj.get(edge.fromNodeId)!.push({ toNodeId: edge.toNodeId, weight, edge });

    if (!edge.oneWay) {
      if (!adj.has(edge.toNodeId)) adj.set(edge.toNodeId, []);
      adj.get(edge.toNodeId)!.push({
        toNodeId: edge.fromNodeId,
        weight,
        edge: { ...edge, fromNodeId: edge.toNodeId, toNodeId: edge.fromNodeId },
      });
    }
  }

  return adj;
}

function edgeWeight(edge: GraphEdge, options: RouteOptions): number {
  let w = edge.walkTimeEstimate ?? edge.distanceEstimate ?? 10;
  if (edge.requiresStairs) w += options.accessibilityMode ? 9999 : 20;
  if (edge.requiresElevator) w += 30;
  return w;
}

export function dijkstra(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string,
  options: RouteOptions = {}
): RouteResult | null {
  const adj = buildAdjacency(edges, options);

  const dist = new Map<string, number>();
  const prev = new Map<string, { nodeId: string; edge: GraphEdge } | null>();

  for (const n of nodes) {
    dist.set(n.id, Infinity);
    prev.set(n.id, null);
  }
  dist.set(startId, 0);

  // Simple priority queue using a sorted array (adequate for indoor graphs)
  const queue = new Set<string>(nodes.map((n) => n.id));

  while (queue.size > 0) {
    let u = "";
    let best = Infinity;
    for (const id of Array.from(queue)) {
      const d = dist.get(id) ?? Infinity;
      if (d < best) {
        best = d;
        u = id;
      }
    }

    if (!u || best === Infinity) break;
    if (u === endId) break;

    queue.delete(u);

    for (const { toNodeId, weight, edge } of adj.get(u) ?? []) {
      if (!queue.has(toNodeId)) continue;
      const alt = (dist.get(u) ?? Infinity) + weight;
      if (alt < (dist.get(toNodeId) ?? Infinity)) {
        dist.set(toNodeId, alt);
        prev.set(toNodeId, { nodeId: u, edge });
      }
    }
  }

  if ((dist.get(endId) ?? Infinity) === Infinity) return null;

  // Reconstruct path
  const pathIds: string[] = [];
  const pathEdges: GraphEdge[] = [];
  let cur: string | null = endId;

  while (cur && cur !== startId) {
    pathIds.unshift(cur);
    const p = prev.get(cur);
    if (!p) return null;
    pathEdges.unshift(p.edge);
    cur = p.nodeId;
  }
  pathIds.unshift(startId);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const path = pathIds.map((id) => nodeMap.get(id)!).filter(Boolean);

  const steps: RouteStep[] = pathEdges.map((edge, i) => {
    const from = nodeMap.get(pathIds[i])!;
    const to = nodeMap.get(pathIds[i + 1])!;
    return {
      fromNode: from,
      toNode: to,
      edge,
      instruction: buildInstruction(from, to, edge),
    };
  });

  const totalDistanceEstimate = pathEdges.reduce(
    (s, e) => s + (e.distanceEstimate ?? 10),
    0
  );
  const totalWalkTimeEstimate = pathEdges.reduce(
    (s, e) => s + (e.walkTimeEstimate ?? 30),
    0
  );

  return { path, steps, totalDistanceEstimate, totalWalkTimeEstimate };
}

function buildInstruction(
  from: GraphNode,
  to: GraphNode,
  edge: GraphEdge
): string {
  if (edge.directionHint) return edge.directionHint;

  if (edge.requiresStairs) {
    const up = to.y < from.y;
    return `Take the stairs ${up ? "up" : "down"} to ${to.name}`;
  }
  if (edge.requiresElevator) {
    return `Take the elevator to ${to.name}`;
  }
  if (edge.requiresRamp) {
    return `Use the ramp to reach ${to.name}`;
  }

  const typeLabels: Record<string, string> = {
    ENTRANCE: "entrance",
    EXIT: "exit",
    ROOM: "room",
    OFFICE: "office",
    RESTROOM: "restroom",
    STAIRCASE: "staircase",
    ELEVATOR: "elevator",
    RECEPTION: "reception",
    LECTURE_HALL: "lecture hall",
  };

  const label = typeLabels[to.type] ?? "location";
  return `Walk to ${to.name}`;
}
