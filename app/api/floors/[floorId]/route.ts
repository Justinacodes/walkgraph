import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBuilding, MAP_EDIT_ROLES } from "@/lib/permissions";
import { canReadBuildingGraph } from "@/lib/access-control";
import { UpdateFloorSchema } from "@/lib/validations/floor";

async function getFloorAccess(floorId: string, userId: string) {
  const floor = await db.floor.findUnique({ where: { id: floorId }, select: { buildingId: true } });
  if (!floor) return { exists: false, allowed: false };
  const access = await canAccessBuilding(floor.buildingId, userId, MAP_EDIT_ROLES);
  return { exists: true, allowed: access.allowed };
}

export async function GET(_: Request, context: { params: Promise<{ floorId: string }> }) {
  const params = await context.params;
  const floorRef = await db.floor.findUnique({ where: { id: params.floorId }, select: { buildingId: true } });
  if (!floorRef) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const access = await canReadBuildingGraph(floorRef.buildingId, session?.user?.id);
  if (!access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!access.memberAccess) {
    const floor = await db.floor.findUnique({
      where: { id: params.floorId },
      select: {
        id: true,
        buildingId: true,
        name: true,
        levelNumber: true,
        description: true,
        accessibilityNotes: true,
        nodes: {
          where: { searchable: true, restricted: false },
          orderBy: { name: "asc" },
          select: { id: true, name: true, type: true, description: true, searchable: true, aliases: true, tags: true },
        },
        _count: { select: { nodes: true } },
      },
    });
    return NextResponse.json(floor);
  }

  const floor = await db.floor.findUnique({
    where: { id: params.floorId },
    include: { nodes: { orderBy: { name: "asc" } }, _count: { select: { nodes: true } } },
  });
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
