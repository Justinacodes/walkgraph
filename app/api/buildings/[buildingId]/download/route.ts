import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { buildingId: string } }) {
  const building = await db.building.findUnique({
    where: { id: params.buildingId, status: "PUBLISHED" },
    include: {
      floors: { orderBy: { levelNumber: "asc" } },
      nodes: true,
      edges: true,
      qrCheckpoints: { where: { active: true } },
    },
  });

  if (!building) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    building: {
      id: building.id,
      name: building.name,
      address: building.address,
      latitude: building.latitude,
      longitude: building.longitude,
      category: building.category,
    },
    floors: building.floors,
    nodes: building.nodes,
    edges: building.edges,
    qrCheckpoints: building.qrCheckpoints,
  });
}
