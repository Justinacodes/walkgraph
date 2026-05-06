import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBuilding, MAP_EDIT_ROLES } from "@/lib/permissions";
import { UpdateEdgeSchema } from "@/lib/validations/edge";

async function getEdgeAccess(edgeId: string, userId: string) {
  const edge = await db.edge.findUnique({ where: { id: edgeId }, select: { buildingId: true } });
  if (!edge) return { exists: false, allowed: false };
  const access = await canAccessBuilding(edge.buildingId, userId, MAP_EDIT_ROLES);
  return { exists: true, allowed: access.allowed, buildingId: edge.buildingId };
}

export async function PATCH(req: Request, context: { params: Promise<{ edgeId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getEdgeAccess(params.edgeId, session.user.id);
  if (!access.exists || !access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateEdgeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const changedNodeIds = [parsed.data.fromNodeId, parsed.data.toNodeId].filter(Boolean) as string[];
  if (changedNodeIds.length > 0) {
    const nodeCount = await db.node.count({ where: { id: { in: changedNodeIds }, buildingId: access.buildingId } });
    if (nodeCount !== changedNodeIds.length) {
      return NextResponse.json({ error: "Edge nodes must belong to the building" }, { status: 400 });
    }
  }

  const updated = await db.edge.update({ where: { id: params.edgeId }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: { params: Promise<{ edgeId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getEdgeAccess(params.edgeId, session.user.id);
  if (!access.exists || !access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.edge.delete({ where: { id: params.edgeId } });
  return NextResponse.json({ ok: true });
}
