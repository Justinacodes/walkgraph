import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateNodeSchema } from "@/lib/validations/node";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get("buildingId");
  const floorId = searchParams.get("floorId");

  if (!buildingId) return NextResponse.json({ error: "buildingId required" }, { status: 400 });

  const nodes = await db.node.findMany({
    where: { buildingId, ...(floorId ? { floorId } : {}) },
    include: { floor: { select: { name: true, levelNumber: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(nodes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CreateNodeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const building = await db.building.findFirst({
      where: { id: parsed.data.buildingId, organization: { ownerId: session.user.id } },
    });
    if (!building) return NextResponse.json({ error: "Building not found" }, { status: 404 });

    const node = await db.node.create({ data: parsed.data });
    return NextResponse.json(node, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
