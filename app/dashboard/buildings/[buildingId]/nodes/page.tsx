import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { GraphEditor } from "./GraphEditor";

export default async function NodesPage({ params }: { params: Promise<{ buildingId: string }> }) {
  const resolvedParams = await params;
  const [building, floors, nodes, edges] = await Promise.all([
    db.building.findUnique({ where: { id: resolvedParams.buildingId } }),
    db.floor.findMany({ where: { buildingId: resolvedParams.buildingId }, orderBy: { levelNumber: "asc" }, select: { id: true, name: true, levelNumber: true, floorPlanImageUrl: true } }),
    db.node.findMany({ where: { buildingId: resolvedParams.buildingId }, include: { floor: { select: { name: true, levelNumber: true } } } }),
    db.edge.findMany({
      where: { buildingId: resolvedParams.buildingId },
      include: {
        fromNode: { select: { id: true, name: true } },
        toNode: { select: { id: true, name: true } },
      },
    }),
  ]);

  if (!building) notFound();

  return (
    <GraphEditor
      buildingId={resolvedParams.buildingId}
      floors={floors}
      initialNodes={nodes}
      initialEdges={edges}
    />
  );
}
