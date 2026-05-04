import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBuilding, MAP_EDIT_ROLES } from "@/lib/permissions";
import { UpdateFloorSchema } from "@/lib/validations/floor";

async function getFloorAccess(floorId: string, userId: string) {
  const floor = await db.floor.findUnique({ where: { id: floorId }, select: { buildingId: true } });
  if (!floor) return { exists: false, allowed: false };
  const access = await canAccessBuilding(floor.buildingId, userId, MAP_EDIT_ROLES);
  return { exists: true, allowed: access.allowed };
}

export async function GET(_: Request, context: { params: Promise<{ floorId: string }> }) {
  const params = await context.params;
  const floor = await db.floor.findUnique({
    where: { id: params.floorId },
    include: { nodes: { orderBy: { name: "asc" } }, _count: { select: { nodes: true } } },
  });
  if (!floor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(floor);
}

export async function PATCH(req: Request, context: { params: Promise<{ floorId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getFloorAccess(params.floorId, session.user.id);
  if (!access.exists || !access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateFloorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const updated = await db.floor.update({ where: { id: params.floorId }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: { params: Promise<{ floorId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getFloorAccess(params.floorId, session.user.id);
  if (!access.exists || !access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.floor.delete({ where: { id: params.floorId } });
  return NextResponse.json({ ok: true });
}
