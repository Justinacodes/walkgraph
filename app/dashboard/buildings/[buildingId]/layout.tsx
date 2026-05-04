import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { BuildingStatusBadge } from "@/components/ui/Badge";

const tabs = [
  { label: "Overview", href: "" },
  { label: "Floors", href: "/floors" },
  { label: "Nodes & Edges", href: "/nodes" },
  { label: "Route Tester", href: "/routes" },
  { label: "QR Codes", href: "/qr" },
];

export default async function BuildingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { buildingId: string };
}) {
  const building = await db.building.findUnique({
    where: { id: params.buildingId },
    include: { organization: { select: { id: true, name: true } } },
  });

  if (!building) notFound();

  const base = `/dashboard/buildings/${params.buildingId}`;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href={`/dashboard/organizations/${building.organization.id}`} className="hover:text-[#141414]">
          {building.organization.name}
        </Link>
        <span>/</span>
        <span className="text-[#141414] font-semibold">{building.name}</span>
        <div className="ml-2">
          <BuildingStatusBadge status={building.status} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-slate-200 mb-8 w-fit">
        {tabs.map((tab) => {
          const href = `${base}${tab.href}`;
          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                "hover:bg-slate-50 text-slate-500 hover:text-[#141414]"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
