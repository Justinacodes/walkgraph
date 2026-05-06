import { db } from "@/lib/db";
import type { GraphEdge, GraphFloor, GraphNode } from "./types";

export async function buildGraph(buildingId: string): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  floors: GraphFloor[];
}> {
  const [nodes, edges, floors] = await Promise.all([
    db.node.findMany({ where: { buildingId } }),
    db.edge.findMany({ where: { buildingId } }),
    db.floor.findMany({ where: { buildingId }, orderBy: { levelNumber: "asc" } }),
  ]);

  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      floorId: node.floorId,
      x: node.x,
      y: node.y,
      searchable: node.searchable,
      restricted: node.restricted,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      distanceEstimate: edge.distanceEstimate,
      walkTimeEstimate: edge.walkTimeEstimate,
      directionHint: edge.directionHint,
      accessible: edge.accessible,
      requiresStairs: edge.requiresStairs,
      requiresElevator: edge.requiresElevator,
      requiresRamp: edge.requiresRamp,
      restricted: edge.restricted,
      oneWay: edge.oneWay,
    })),
    floors: floors.map((floor) => ({
      id: floor.id,
      name: floor.name,
      levelNumber: floor.levelNumber,
    })),
  };
}
