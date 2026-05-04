import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { BuildingStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/layout/EmptyState";
import { NewBuildingModal } from "./NewBuildingModal";

export default async function OrgDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  const org = await db.organization.findUnique({
    where: { id: resolvedParams.orgId },
    include: {
      buildings: {
        include: { _count: { select: { nodes: true, floors: true } } },
        orderBy: { updatedAt: "desc" },
      },
      _count: { select: { buildings: true, members: true } },
    },
  });

  if (!org) notFound();

  const isOwner = org.ownerId === session?.user?.id;

  return (
    <div>
      <PageHeader
        title={org.name}
        subtitle={`/${org.slug} · ${org._count.buildings} buildings`}
        actions={
          isOwner ? <NewBuildingModal orgId={org.id} /> : null
        }
      />

      {org.buildings.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="No buildings yet"
          description="Add your first building to start creating indoor maps."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {org.buildings.map((b) => (
            <Link key={b.id} href={`/dashboard/buildings/${b.id}`}>
              <Card hover className="h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg">{b.name}</h3>
                  <BuildingStatusBadge status={b.status} />
                </div>
                {b.address && <p className="text-sm text-slate-500 mb-3">{b.address}</p>}
                <div className="flex gap-4 font-mono text-xs text-slate-400">
                  <span>{b._count.floors} floors</span>
                  <span>{b._count.nodes} nodes</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
