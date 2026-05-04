import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Layers } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { NewFloorModal } from "./NewFloorModal";

export default async function FloorsPage({ params }: { params: { buildingId: string } }) {
  const floors = await db.floor.findMany({
    where: { buildingId: params.buildingId },
    include: { _count: { select: { nodes: true } } },
    orderBy: { levelNumber: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Floors"
        subtitle="Define the floors in this building"
        actions={<NewFloorModal buildingId={params.buildingId} />}
      />

      {floors.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-8 h-8" />}
          title="No floors yet"
          description="Add floors to start placing navigation nodes."
        />
      ) : (
        <div className="space-y-3">
          {floors.map((floor) => (
            <Card key={floor.id} className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#141414] text-white rounded-2xl flex items-center justify-center font-mono font-bold text-base sm:text-lg shrink-0">
                {floor.levelNumber}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{floor.name}</p>
                {floor.description && <p className="text-sm text-slate-500 truncate">{floor.description}</p>}
              </div>
              <div className="font-mono text-xs text-slate-400 shrink-0">
                {floor._count.nodes} nodes
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
