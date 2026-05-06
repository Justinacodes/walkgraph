import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBuilding, MAP_EDIT_ROLES } from "@/lib/permissions";
import { canReadBuildingGraph } from "@/lib/access-control";
import { UpdateNodeSchema } from "@/lib/validations/node";

async function getNodeAccess(nodeId: string, userId: string) {
  const node = await db.node.findUnique({ where: { id: nodeId }, select: { buildingId: true } });
  if (!node) return { exists: false, allowed: false };
  const access = await canAccessBuilding(node.buildingId, userId, MAP_EDIT_ROLES);
  return { exists: true, allowed: access.allowed, buildingId: node.buildingId };
}

export async function GET(_: Request, context: { params: Promise<{ nodeId: string }> }) {
  const params = await context.params;
  const nodeRef = await db.node.findUnique({
    where: { id: params.nodeId },
    select: { buildingId: true, searchable: true, restricted: true },
  });
  if (!nodeRef) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const access = await canReadBuildingGraph(nodeRef.buildingId, session?.user?.id);
  if (!access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!access.memberAccess) {
    if (!nodeRef.searchable || nodeRef.restricted) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const node = await db.node.findUnique({
      where: { id: params.nodeId },
      select: {
        id: true,
        buildingId: true,
        floorId: true,
        name: true,
        type: true,
        description: true,
        x: true,
        y: true,
        searchable: true,
        tags: true,
        aliases: true,
        accessibilityFlags: true,
        floor: { select: { name: true, levelNumber: true } },
      },
    });
    return NextResponse.json(node);
  }

  const node = await db.node.findUnique({
    where: { id: params.nodeId },
    include: {
      floor: { select: { name: true, levelNumber: true } },
      edgesFrom: { include: { toNode: { select: { id: true, name: true, type: true } } } },
      edgesTo: { include: { fromNode: { select: { id: true, name: true, type: true } } } },
      qrCheckpoints: true,
    },
  });
  return NextResponse.json(node);
}

export async function PATCH(req: Request, context: { params: Promise<{ nodeId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getNodeAccess(params.nodeId, session.user.id);
  if (!access.exists || !access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateNodeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  if (parsed.data.floorId) {
    const floor = await db.floor.findFirst({ where: { id: parsed.data.floorId, buildingId: access.buildingId } });
    if (!floor) return NextResponse.json({ error: "Floor not found for building" }, { status: 400 });
  }

  const updated = await db.node.update({ where: { id: params.nodeId }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: { params: Promise<{ nodeId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getNodeAccess(params.nodeId, session.user.id);
  if (!access.exists || !access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.node.delete({ where: { id: params.nodeId } });
  return NextResponse.json({ ok: true });
}
