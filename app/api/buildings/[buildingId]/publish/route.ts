import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBuilding, ORG_WRITE_ROLES } from "@/lib/permissions";

export async function POST(_: Request, context: { params: Promise<{ buildingId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await canAccessBuilding(params.buildingId, session.user.id, ORG_WRITE_ROLES);
  if (!access.exists || !access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const building = await db.building.findUnique({
    where: { id: params.buildingId },
    include: { nodes: true, edges: true, floors: true },
  });

  if (!building) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newStatus = building.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

  if (newStatus === "PUBLISHED") {
    const readinessError = validatePublishReadiness(building);
    if (readinessError) {
      return NextResponse.json({ error: readinessError }, { status: 400 });
    }
  }

  const updated = await db.building.update({
    where: { id: params.buildingId },
    data: { status: newStatus },
  });

  if (newStatus === "PUBLISHED") {
    const lastVersion = await db.mapVersion.findFirst({
      where: { buildingId: params.buildingId },
      orderBy: { versionNumber: "desc" },
    });

    await db.mapVersion.create({
      data: {
        buildingId: params.buildingId,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        status: "PUBLISHED",
        createdBy: session.user.id,
        publishedAt: new Date(),
        snapshotJson: {
          building: { id: building.id, name: building.name },
          floors: building.floors,
          nodes: building.nodes,
          edges: building.edges,
        },
      },
    });
  }

  return NextResponse.json(updated);
}

function validatePublishReadiness(building: {
  floors: Array<{ id: string }>;
  nodes: Array<{ id: string; floorId: string; searchable: boolean; restricted: boolean }>;
  edges: Array<{ fromNodeId: string; toNodeId: string; requiresStairs: boolean; requiresElevator: boolean; requiresRamp: boolean }>;
}) {
  if (building.floors.length === 0) return "Add at least one floor before publishing.";

  const floorIds = new Set(building.floors.map((floor) => floor.id));
  const routableNodes = building.nodes.filter((node) => node.searchable && !node.restricted && floorIds.has(node.floorId));
  if (routableNodes.length < 2) return "Add at least two searchable, unrestricted nodes before publishing.";

  const nodeById = new Map(building.nodes.map((node) => [node.id, node]));
  const routableNodeIds = new Set(routableNodes.map((node) => node.id));
  const routableEdges = building.edges.filter((edge) => routableNodeIds.has(edge.fromNodeId) && routableNodeIds.has(edge.toNodeId));
  if (routableEdges.length === 0) return "Connect searchable nodes with at least one edge before publishing.";

  const invalidEdge = building.edges.find((edge) => !nodeById.has(edge.fromNodeId) || !nodeById.has(edge.toNodeId));
  if (invalidEdge) return "Fix edges with missing endpoint nodes before publishing.";

  const unflaggedCrossFloorEdge = building.edges.find((edge) => {
    const fromNode = nodeById.get(edge.fromNodeId);
    const toNode = nodeById.get(edge.toNodeId);
    return fromNode && toNode && fromNode.floorId !== toNode.floorId && !edge.requiresStairs && !edge.requiresElevator && !edge.requiresRamp;
  });
  if (unflaggedCrossFloorEdge) return "Flag every cross-floor edge as stairs, elevator, or ramp before publishing.";

  return null;
}
