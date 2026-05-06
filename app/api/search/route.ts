import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const limited = rateLimit(`search:${getClientIp(req)}`, 120, 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many search requests. Try again shortly." }, { status: 429, headers: rateLimitHeaders(limited) });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const buildingId = searchParams.get("buildingId");

  if (!q || q.length < 1) return NextResponse.json({ nodes: [], buildings: [] });

  const searchTerm = q.toLowerCase();

  if (buildingId) {
    const building = await db.building.findUnique({
      where: { id: buildingId },
      select: { status: true, visibility: true },
    });

    if (!building || building.status !== "PUBLISHED" || building.visibility !== "PUBLIC") {
      return NextResponse.json({ nodes: [], buildings: [] });
    }

    const nodes = await db.node.findMany({
      where: {
        buildingId,
        searchable: true,
        restricted: false,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { aliases: { hasSome: [q, searchTerm] } },
          { tags: { hasSome: [q, searchTerm] } },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        aliases: true,
        tags: true,
        description: true,
        floor: { select: { name: true, levelNumber: true } },
      },
      take: 20,
    });
    return NextResponse.json({ nodes, buildings: [] });
  }

  const buildings = await db.building.findMany({
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { organization: { select: { name: true } } },
    take: 20,
  });

  return NextResponse.json({ nodes: [], buildings });
}
