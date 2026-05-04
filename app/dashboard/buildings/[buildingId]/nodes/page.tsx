import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { GraphEditor } from "./GraphEditor";

export default async function NodesPage({ params }: { params: { buildingId: string } }) {
  const [building, floors, nodes, edges] = await Promise.all([
    db.building.findUnique({ where: { id: params.buildingId } }),
    db.floor.findMany({ where: { buildingId: params.buildingId }, orderBy: { levelNumber: "asc" }, select: { id: true, name: true, levelNumber: true, floorPlanImageUrl: true } }),
    db.node.findMany({ where: { buildingId: params.buildingId }, include: { floor: { select: { name: true, levelNumber: true } } } }),
    db.edge.findMany({
      where: { buildingId: params.buildingId },
      include: {
        fromNode: { select: { id: true, name: true } },
        toNode: { select: { id: true, name: true } },
      },
    }),
  ]);

  if (!building) notFound();

  return (
    <GraphEditor
      buildingId={params.buildingId}
      floors={floors}
      initialNodes={nodes}
      initialEdges={edges}
    />
  );
}
