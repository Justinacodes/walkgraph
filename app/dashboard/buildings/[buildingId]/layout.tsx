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
  { label: "Accessibility", href: "/accessibility" },
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
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-5">
        <Link href={`/dashboard/organizations/${building.organization.id}`} className="hover:text-[#141414] truncate max-w-[140px] sm:max-w-none">
          {building.organization.name}
        </Link>
        <span>/</span>
        <span className="text-[#141414] font-semibold truncate max-w-[160px] sm:max-w-none">{building.name}</span>
        <BuildingStatusBadge status={building.status} />
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="mb-8 -mx-4 lg:mx-0 px-4 lg:px-0">
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-slate-200 w-max min-w-full sm:min-w-0 sm:w-fit overflow-x-auto">
          {tabs.map((tab) => {
            const href = `${base}${tab.href}`;
            return (
              <Link
                key={tab.href}
                href={href}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                  "hover:bg-slate-50 text-slate-500 hover:text-[#141414]"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
