export const dynamic = "force-dynamic";
import Link from "next/link";
import { db } from "@/lib/db";
import { Building2, MapPin } from "lucide-react";
import { BuildingStatusBadge } from "@/components/ui/Badge";
import { ExploreSearch } from "./ExploreSearch";

export const metadata = { title: "Explore Buildings" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.trim();

  const buildings = await db.building.findMany({
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { address: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      organization: { select: { name: true } },
      _count: { select: { nodes: true, floors: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 24,
  });

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Header */}
      <div className="bg-[#141414] text-white px-8 lg:px-20 py-12">
        <Link href="/" className="font-display text-2xl text-white block mb-8">WalkGraph</Link>
        <h1 className="text-4xl font-bold mb-3">Explore Indoor Maps</h1>
        <p className="text-white/60 mb-6">Find buildings with indoor navigation</p>
        <ExploreSearch initialQuery={query ?? ""} />
      </div>

      {/* Results */}
      <div className="px-8 lg:px-20 py-12">
        {query ? (
          <p className="font-mono text-xs uppercase tracking-widest text-slate-400 mb-6">
            Search results for “{query}”
          </p>
        ) : null}
        {buildings.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3" />
            <p>{query ? "No published buildings matched your search." : "No published buildings yet."}</p>
          </div>
        ) : (
          <>
            <p className="font-mono text-xs uppercase tracking-widest text-slate-400 mb-6">
              {buildings.length} buildings available
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buildings.map((b) => (
                <Link key={b.id} href={`/explore/${b.id}`}>
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 hover:border-[#141414] hover:shadow-lg transition-all cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg">{b.name}</h3>
                      <BuildingStatusBadge status={b.status} />
                    </div>
                    <p className="text-sm text-slate-500 mb-1">{b.organization.name}</p>
                    {b.address && (
                      <div className="flex items-center gap-1 text-sm text-slate-400 mb-3">
                        <MapPin className="w-3 h-3" /> {b.address}
                      </div>
                    )}
                    {b.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{b.description}</p>
                    )}
                    <div className="flex gap-4 font-mono text-xs text-slate-400">
                      <span>{b._count.floors} floors</span>
                      <span>{b._count.nodes} nodes</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
