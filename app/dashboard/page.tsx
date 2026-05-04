import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Building2, Map, Plus } from "lucide-react";
import { BuildingStatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [orgs, recentBuildings] = await Promise.all([
    db.organization.findMany({
      where: { ownerId: userId },
      include: { _count: { select: { buildings: true } } },
      take: 3,
    }),
    db.building.findMany({
      where: { organization: { ownerId: userId } },
      include: { organization: { select: { name: true, id: true } }, _count: { select: { nodes: true, floors: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${session?.user?.name?.split(" ")[0] ?? "there"}`}
        subtitle="Manage your indoor maps and building navigation"
        actions={
          <Link href="/dashboard/organizations/new">
            <Button variant="blue" size="md">
              <Plus className="w-4 h-4" />
              New Organization
            </Button>
          </Link>
        }
      />

      {/* Orgs */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Your Organizations</h2>
          <Link href="/dashboard/organizations" className="text-sm text-blue-600 font-semibold hover:underline">
            View all
          </Link>
        </div>
        {orgs.length === 0 ? (
          <Card className="py-12 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-4">No organizations yet.</p>
            <Link href="/dashboard/organizations/new">
              <Button size="sm">Create your first org</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orgs.map((org) => (
              <Link key={org.id} href={`/dashboard/organizations/${org.id}`}>
                <Card hover className="h-full">
                  <div className="w-10 h-10 bg-[#141414] rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4">
                    {org.name[0].toUpperCase()}
                  </div>
                  <p className="font-bold">{org.name}</p>
                  <p className="font-mono text-xs text-slate-400 mt-1">{org._count.buildings} buildings</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Buildings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Recent Buildings</h2>
          <Link href="/explore" className="text-sm text-blue-600 font-semibold hover:underline">
            Explore public maps
          </Link>
        </div>
        {recentBuildings.length === 0 ? (
          <Card className="py-12 text-center">
            <Map className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No buildings yet. Create an organization to get started.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBuildings.map((b) => (
              <Link key={b.id} href={`/dashboard/buildings/${b.id}`}>
                <Card hover className="h-full">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-bold">{b.name}</p>
                    <BuildingStatusBadge status={b.status} />
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{b.organization.name}</p>
                  <div className="flex gap-4 font-mono text-xs text-slate-400">
                    <span>{b._count.floors} floors</span>
                    <span>{b._count.nodes} nodes</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
