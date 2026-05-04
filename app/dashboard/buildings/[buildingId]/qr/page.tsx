import { db } from "@/lib/db";
import { QRManager } from "./QRManager";

export default async function QRPage({ params }: { params: { buildingId: string } }) {
  const nodes = await db.node.findMany({
    where: { buildingId: params.buildingId, searchable: true },
    include: {
      floor: { select: { name: true, levelNumber: true } },
      qrCheckpoints: { where: { active: true } },
    },
    orderBy: { name: "asc" },
  });

  return <QRManager buildingId={params.buildingId} nodes={nodes} />;
}
