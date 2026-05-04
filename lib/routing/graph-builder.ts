import { db } from "@/lib/db";
import type { GraphNode, GraphEdge } from "./types";

export async function buildGraph(buildingId: string): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
}> {
  const [nodes, edges] = await Promise.all([
    db.node.findMany({ where: { buildingId } }),
    db.edge.findMany({ where: { buildingId } }),
  ]);

  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      floorId: n.floorId,
      x: n.x,
      y: n.y,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      fromNodeId: e.fromNodeId,
      toNodeId: e.toNodeId,
      distanceEstimate: e.distanceEstimate,
      walkTimeEstimate: e.walkTimeEstimate,
      directionHint: e.directionHint,
      accessible: e.accessible,
      requiresStairs: e.requiresStairs,
      requiresElevator: e.requiresElevator,
      requiresRamp: e.requiresRamp,
      restricted: e.restricted,
      oneWay: e.oneWay,
    })),
  };
}
