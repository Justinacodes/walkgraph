import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { RouteTester } from "./RouteTester";

export default async function RoutesPage({ params }: { params: { buildingId: string } }) {
  const [nodes, floors] = await Promise.all([
    db.node.findMany({
      where: { buildingId: params.buildingId, searchable: true },
      include: { floor: { select: { name: true, levelNumber: true } } },
      orderBy: { name: "asc" },
    }),
    db.floor.findMany({
      where: { buildingId: params.buildingId },
      orderBy: { levelNumber: "asc" },
    }),
  ]);

  return <RouteTester buildingId={params.buildingId} nodes={nodes} />;
}
