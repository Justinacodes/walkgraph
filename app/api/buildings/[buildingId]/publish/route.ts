import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBuilding, ORG_WRITE_ROLES } from "@/lib/permissions";

export async function POST(_: Request, context: { params: Promise<{ buildingId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await canAccessBuilding(params.buildingId, session.user.id, ORG_WRITE_ROLES);
  if (!access.exists || !access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const building = await db.building.findUnique({
    where: { id: params.buildingId },
    include: { nodes: true, edges: true, floors: true },
  });

  if (!building) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newStatus = building.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

  const updated = await db.building.update({
    where: { id: params.buildingId },
    data: { status: newStatus },
  });

  if (newStatus === "PUBLISHED") {
    const lastVersion = await db.mapVersion.findFirst({
      where: { buildingId: params.buildingId },
      orderBy: { versionNumber: "desc" },
    });

    await db.mapVersion.create({
      data: {
        buildingId: params.buildingId,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        status: "PUBLISHED",
        createdBy: session.user.id,
        publishedAt: new Date(),
        snapshotJson: {
          building: { id: building.id, name: building.name },
          floors: building.floors,
          nodes: building.nodes,
          edges: building.edges,
        },
      },
    });
  }

  return NextResponse.json(updated);
}
