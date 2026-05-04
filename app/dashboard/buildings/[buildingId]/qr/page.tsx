import { db } from "@/lib/db";
import { QRManager } from "./QRManager";

export default async function QRPage({ params }: { params: Promise<{ buildingId: string }> }) {
  const resolvedParams = await params;
  const nodes = await db.node.findMany({
    where: { buildingId: resolvedParams.buildingId, searchable: true },
    include: {
      floor: { select: { name: true, levelNumber: true } },
      qrCheckpoints: { where: { active: true } },
    },
    orderBy: { name: "asc" },
  });

  return <QRManager buildingId={resolvedParams.buildingId} nodes={nodes} />;
}
