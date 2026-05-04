import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdateBuildingSchema } from "@/lib/validations/building";

async function getBuilding(buildingId: string, userId: string) {
  return db.building.findFirst({
    where: { id: buildingId, organization: { ownerId: userId } },
  });
}

export async function GET(_: Request, { params }: { params: { buildingId: string } }) {
  const building = await db.building.findUnique({
    where: { id: params.buildingId },
    include: {
      floors: { orderBy: { levelNumber: "asc" } },
      organization: { select: { name: true, slug: true } },
      _count: { select: { nodes: true, edges: true, floors: true } },
    },
  });

  if (!building) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(building);
}

export async function PATCH(req: Request, { params }: { params: { buildingId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const building = await getBuilding(params.buildingId, session.user.id);
  if (!building) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateBuildingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const updated = await db.building.update({ where: { id: params.buildingId }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { buildingId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const building = await getBuilding(params.buildingId, session.user.id);
  if (!building) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.building.delete({ where: { id: params.buildingId } });
  return NextResponse.json({ ok: true });
}
