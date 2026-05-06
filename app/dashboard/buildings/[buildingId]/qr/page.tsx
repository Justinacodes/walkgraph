import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { QRManager } from "./QRManager";

export default async function QRPage({ params }: { params: Promise<{ buildingId: string }> }) {
  const resolvedParams = await params;

  const building = await db.building.findUnique({
    where: { id: resolvedParams.buildingId },
    select: { id: true, name: true },
  });

  if (!building) {
    notFound();
  }

  const nodes = await db.node.findMany({
    where: { buildingId: resolvedParams.buildingId, searchable: true },
    select: {
      id: true,
      name: true,
      type: true,
      floor: { select: { id: true, name: true, levelNumber: true } },
      qrCheckpoints: {
        where: { active: true },
        select: { id: true, code: true, label: true, active: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ floor: { levelNumber: "asc" } }, { name: "asc" }],
  });

  return <QRManager building={building} nodes={nodes} />;
}
