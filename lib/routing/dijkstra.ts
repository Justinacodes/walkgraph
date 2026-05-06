import type { GraphEdge, GraphFloor, GraphNode, RouteOptions, RouteResult, RouteStep, RouteWarning } from "./types";

interface AdjEntry {
  toNodeId: string;
  weight: number;
  edge: GraphEdge;
  warnings: RouteWarning[];
}

interface SearchOptions extends RouteOptions {
  allowUnknownAccessibility?: boolean;
}

const VERTICAL_TYPES = new Set(["STAIRCASE", "ELEVATOR"]);

function isVerticalEdge(edge: GraphEdge, from: GraphNode, to: GraphNode) {
  return edge.requiresStairs || edge.requiresElevator || edge.requiresRamp || from.floorId !== to.floorId;
}

function edgeWeight(edge: GraphEdge, options: RouteOptions): number {
  let weight = edge.walkTimeEstimate ?? edge.distanceEstimate ?? 10;
  if (weight < 0) return Infinity;
  if (edge.requiresStairs) weight += options.accessibilityMode ? Infinity : 20;
  if (edge.requiresElevator) weight += options.accessibilityMode ? 15 : 30;
  if (edge.requiresRamp) weight += options.accessibilityMode ? 0 : 5;
  return weight;
}

function eligibleEdge(edge: GraphEdge, from: GraphNode, to: GraphNode, options: SearchOptions): RouteWarning[] | null {
  if (edge.restricted || from.restricted || to.restricted) return null;
  if (edge.requiresStairs && options.accessibilityMode) return null;

  const vertical = isVerticalEdge(edge, from, to);
  if (vertical && !edge.requiresStairs && !edge.requiresElevator && !edge.requiresRamp && !VERTICAL_TYPES.has(from.type) && !VERTICAL_TYPES.has(to.type)) {
    return null;
  }

  if (options.accessibilityMode && !edge.accessible) {
    if (!options.allowUnknownAccessibility || edge.requiresStairs) return null;
    return [{ code: "ACCESSIBILITY_FALLBACK", message: "No fully verified accessible route was found; this route may include segments without confirmed accessibility metadata." }];
  }

  return [];
}

function buildAdjacency(nodes: GraphNode[], edges: GraphEdge[], options: SearchOptions): Map<string, AdjEntry[]> {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const adj = new Map<string, AdjEntry[]>();

  function add(fromNodeId: string, toNodeId: string, edge: GraphEdge) {
    const from = nodeMap.get(fromNodeId);
    const to = nodeMap.get(toNodeId);
    if (!from || !to) return;
    const warnings = eligibleEdge(edge, from, to, options);
    if (!warnings) return;
    const weight = edgeWeight(edge, options);
    if (!Number.isFinite(weight)) return;
    const entries = adj.get(fromNodeId) ?? [];
    entries.push({ toNodeId, weight, edge, warnings });
    entries.sort((a, b) => a.weight - b.weight || a.edge.id.localeCompare(b.edge.id) || a.toNodeId.localeCompare(b.toNodeId));
    adj.set(fromNodeId, entries);
  }

  for (const edge of edges) {
    add(edge.fromNodeId, edge.toNodeId, edge);
    if (!edge.oneWay) add(edge.toNodeId, edge.fromNodeId, { ...edge, fromNodeId: edge.toNodeId, toNodeId: edge.fromNodeId });
  }

  return adj;
}

function runSearch(nodes: GraphNode[], edges: GraphEdge[], startId: string, endId: string, options: SearchOptions) {
  const adj = buildAdjacency(nodes, edges, options);
  const dist = new Map<string, number>();
  const prev = new Map<string, { nodeId: string; edge: GraphEdge; warnings: RouteWarning[] } | null>();
  const queue = new Set(nodes.map((node) => node.id));

  for (const node of nodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }
  dist.set(startId, 0);

  while (queue.size > 0) {
    const current = Array.from(queue).sort((a, b) => (dist.get(a) ?? Infinity) - (dist.get(b) ?? Infinity) || a.localeCompare(b))[0];
    const currentDistance = dist.get(current) ?? Infinity;
    if (currentDistance === Infinity) break;
    queue.delete(current);
    if (current === endId) break;

    for (const entry of adj.get(current) ?? []) {
      if (!queue.has(entry.toNodeId)) continue;
      const alternative = currentDistance + entry.weight;
      const existing = dist.get(entry.toNodeId) ?? Infinity;
      if (alternative < existing || (alternative === existing && entry.edge.id.localeCompare(prev.get(entry.toNodeId)?.edge.id ?? "") < 0)) {
        dist.set(entry.toNodeId, alternative);
        prev.set(entry.toNodeId, { nodeId: current, edge: entry.edge, warnings: entry.warnings });
      }
    }
  }

  if ((dist.get(endId) ?? Infinity) === Infinity) return null;
  return prev;
}

export function dijkstra(nodes: GraphNode[], edges: GraphEdge[], floors: GraphFloor[], startId: string, endId: string, options: RouteOptions = {}): RouteResult | null {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const floorMap = new Map(floors.map((floor) => [floor.id, floor]));
  const start = nodeMap.get(startId);
  const end = nodeMap.get(endId);
  if (!start || !end || start.restricted || end.restricted) return null;

  if (startId === endId) {
    return {
      path: [start],
      steps: [],
      totalDistanceEstimate: 0,
      totalWalkTimeEstimate: 0,
      floorChanges: 0,
      warnings: [{ code: "ALREADY_THERE", message: `You are already at ${start.name}.` }],
    };
  }

  let prev = runSearch(nodes, edges, startId, endId, options);
  if (!prev && options.accessibilityMode) prev = runSearch(nodes, edges, startId, endId, { ...options, allowUnknownAccessibility: true });
  if (!prev) return null;

  const pathIds: string[] = [];
  const pathEdges: GraphEdge[] = [];
  const warnings: RouteWarning[] = [];
  let current: string | null = endId;

  while (current && current !== startId) {
    pathIds.unshift(current);
    const previous = prev.get(current);
    if (!previous) return null;
    pathEdges.unshift(previous.edge);
    for (const warning of previous.warnings) if (!warnings.some((item) => item.code === warning.code)) warnings.push(warning);
    current = previous.nodeId;
  }
  pathIds.unshift(startId);

  const path = pathIds.map((id) => nodeMap.get(id)).filter((node): node is GraphNode => Boolean(node));
  const steps: RouteStep[] = pathEdges.map((edge, index) => {
    const from = nodeMap.get(pathIds[index])!;
    const to = nodeMap.get(pathIds[index + 1])!;
    const floorChange = from.floorId !== to.floorId;
    const targetFloorName = floorMap.get(to.floorId)?.name ?? null;
    return { fromNode: from, toNode: to, edge, floorChange, targetFloorName, instruction: buildInstruction(from, to, edge, targetFloorName) };
  });

  if (options.accessibilityMode && warnings.length === 0) warnings.push({ code: "ACCESSIBLE_ROUTE", message: "This route avoids stairs and restricted paths." });

  return {
    path,
    steps,
    totalDistanceEstimate: pathEdges.reduce((sum, edge) => sum + (edge.distanceEstimate ?? 10), 0),
    totalWalkTimeEstimate: pathEdges.reduce((sum, edge) => sum + (edge.walkTimeEstimate ?? 30), 0),
    floorChanges: steps.filter((step) => step.floorChange).length,
    warnings,
  };
}

function buildInstruction(from: GraphNode, to: GraphNode, edge: GraphEdge, targetFloorName: string | null): string {
  const target = targetFloorName ?? "the next floor";
  const hint = edge.directionHint?.trim();
  if (hint) return from.floorId !== to.floorId && targetFloorName && !hint.toLowerCase().includes(targetFloorName.toLowerCase()) ? `${hint} Continue to ${targetFloorName}.` : hint;
  if (edge.requiresStairs) return `Take the stairs to ${target}, then continue to ${to.name}.`;
  if (edge.requiresElevator) return `Take the elevator to ${target}, then exit toward ${to.name}.`;
  if (edge.requiresRamp) return `Use the ramp to reach ${targetFloorName ?? to.name}.`;
  if (from.floorId !== to.floorId) return `Change floors to ${target}, then continue to ${to.name}.`;
  if (["CORRIDOR", "LANDMARK"].includes(to.type)) return `Continue toward ${to.name}.`;
  return `Walk to ${to.name}.`;
}
