import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { RouteTester } from "./RouteTester";

export default async function RoutesPage({ params }: { params: Promise<{ buildingId: string }> }) {
  const resolvedParams = await params;
  const [nodes, floors] = await Promise.all([
    db.node.findMany({
      where: { buildingId: resolvedParams.buildingId, searchable: true },
      include: { floor: { select: { name: true, levelNumber: true } } },
      orderBy: { name: "asc" },
    }),
    db.floor.findMany({
      where: { buildingId: resolvedParams.buildingId },
      orderBy: { levelNumber: "asc" },
    }),
  ]);

  return <RouteTester buildingId={resolvedParams.buildingId} nodes={nodes} />;
}
