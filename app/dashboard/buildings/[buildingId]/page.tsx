import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Layers, MapPin, Network, QrCode } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PublishButton } from "./PublishButton";

export default async function BuildingDetailPage({ params }: { params: { buildingId: string } }) {
  const session = await getServerSession(authOptions);
  const building = await db.building.findUnique({
    where: { id: params.buildingId },
    include: {
      floors: { orderBy: { levelNumber: "asc" } },
      _count: { select: { nodes: true, edges: true, floors: true, qrCheckpoints: true } },
      organization: { select: { ownerId: true, name: true } },
    },
  });

  if (!building) notFound();

  const isOwner = building.organization.ownerId === session?.user?.id;
  const base = `/dashboard/buildings/${params.buildingId}`;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">{building.name}</h1>
          {building.address && <p className="text-slate-500 mt-1 text-sm">{building.address}</p>}
          {building.description && <p className="text-slate-600 mt-2 max-w-xl text-sm">{building.description}</p>}
        </div>
        {isOwner && <div className="shrink-0"><PublishButton buildingId={building.id} status={building.status} /></div>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Floors", value: building._count.floors, icon: Layers, href: `${base}/floors` },
          { label: "Nodes", value: building._count.nodes, icon: MapPin, href: `${base}/nodes` },
          { label: "Edges", value: building._count.edges, icon: Network, href: `${base}/nodes` },
          { label: "QR Codes", value: building._count.qrCheckpoints, icon: QrCode, href: `${base}/qr` },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card hover className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={`${base}/floors`}>
          <Card hover>
            <Layers className="w-6 h-6 mb-3 text-blue-600" />
            <h3 className="font-bold">Manage Floors</h3>
            <p className="text-sm text-slate-500 mt-1">Add and configure building floors</p>
          </Card>
        </Link>
        <Link href={`${base}/nodes`}>
          <Card hover>
            <Network className="w-6 h-6 mb-3 text-emerald-600" />
            <h3 className="font-bold">Graph Editor</h3>
            <p className="text-sm text-slate-500 mt-1">Add nodes and connect them with edges</p>
          </Card>
        </Link>
        <Link href={`${base}/routes`}>
          <Card hover>
            <MapPin className="w-6 h-6 mb-3 text-amber-600" />
            <h3 className="font-bold">Test Routes</h3>
            <p className="text-sm text-slate-500 mt-1">Preview navigation paths between nodes</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
