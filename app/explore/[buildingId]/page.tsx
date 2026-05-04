export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { MapPin, Layers, Navigation, ArrowLeft, QrCode, Download } from "lucide-react";
import { BuildingStatusBadge } from "@/components/ui/Badge";
import { IndoorNavigator } from "./IndoorNavigator";

export default async function BuildingExplorePage({ params }: { params: Promise<{ buildingId: string }> }) {
  const resolvedParams = await params;
  const building = await db.building.findUnique({
    where: { id: resolvedParams.buildingId },
    include: {
      floors: { orderBy: { levelNumber: "asc" } },
      organization: { select: { name: true } },
      nodes: {
        where: { searchable: true },
        include: { floor: { select: { name: true, levelNumber: true } } },
        orderBy: { name: "asc" },
      },
      _count: { select: { nodes: true, floors: true } },
    },
  });

  if (!building || building.status !== "PUBLISHED") notFound();

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <div className="bg-[#141414] text-white px-8 lg:px-20 py-8">
        <Link href="/explore" className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Explore
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{building.name}</h1>
            <p className="text-white/60 mb-2">{building.organization.name}</p>
            {building.address && (
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <MapPin className="w-4 h-4" /> {building.address}
              </div>
            )}
          </div>
          <BuildingStatusBadge status={building.status} />
        </div>
        <div className="flex gap-6 mt-6 font-mono text-xs text-white/40">
          <span>{building._count.floors} floors</span>
          <span>{building._count.nodes} navigation points</span>
        </div>
      </div>

      <div className="px-8 lg:px-20 py-10">
        <IndoorNavigator
          buildingId={building.id}
          nodes={building.nodes}
          floors={building.floors}
        />
      </div>
    </div>
  );
}
