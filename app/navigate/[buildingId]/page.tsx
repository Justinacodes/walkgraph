export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { QRNavigator } from "./QRNavigator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NavigatePage({
  params,
  searchParams,
}: {
  params: { buildingId: string };
  searchParams: { node?: string };
}) {
  const building = await db.building.findUnique({
    where: { id: params.buildingId },
    include: {
      floors: { orderBy: { levelNumber: "asc" } },
      nodes: {
        where: { searchable: true },
        include: { floor: { select: { name: true, levelNumber: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!building || building.status !== "PUBLISHED") notFound();

  // Resolve QR checkpoint code → node
  let currentNodeId: string | null = null;
  if (searchParams.node) {
    const checkpoint = await db.qRCheckpoint.findUnique({
      where: { code: searchParams.node },
      select: { nodeId: true, buildingId: true, active: true },
    });
    if (checkpoint?.buildingId === params.buildingId && checkpoint.active) {
      currentNodeId = checkpoint.nodeId;
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Header */}
      <div className="bg-[#141414] text-white px-5 py-5 safe-area-top">
        <Link
          href={`/explore/${params.buildingId}`}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-4 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to building
        </Link>
        <h1 className="text-2xl font-bold">{building.name}</h1>
        <p className="text-white/50 text-sm mt-1">Indoor Navigation</p>
      </div>

      <QRNavigator
        buildingId={building.id}
        nodes={building.nodes}
        floors={building.floors}
        currentNodeId={currentNodeId}
      />
    </div>
  );
}
