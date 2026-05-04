import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBuilding, ORG_WRITE_ROLES } from "@/lib/permissions";
import { UpdateBuildingSchema } from "@/lib/validations/building";

export async function GET(_: Request, context: { params: Promise<{ buildingId: string }> }) {
  const params = await context.params;
  const building = await db.building.findUnique({
    where: { id: params.buildingId },
    include: {
      floors: { orderBy: { levelNumber: "asc" } },
      organization: { select: { name: true, slug: true } },
      _count: { select: { nodes: true, edges: true, floors: true } },
    },
  });

  if (!building) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (building.status !== "PUBLISHED" || building.visibility !== "PUBLIC") {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const access = await canAccessBuilding(params.buildingId, session.user.id);
    if (!access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(building);
}

export async function PATCH(req: Request, context: { params: Promise<{ buildingId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await canAccessBuilding(params.buildingId, session.user.id, ORG_WRITE_ROLES);
  if (!access.exists || !access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateBuildingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const updated = await db.building.update({ where: { id: params.buildingId }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: { params: Promise<{ buildingId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await canAccessBuilding(params.buildingId, session.user.id, ["OWNER"]);
  if (!access.exists || !access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.building.delete({ where: { id: params.buildingId } });
  return NextResponse.json({ ok: true });
}
