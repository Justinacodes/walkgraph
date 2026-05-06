import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBuilding, MAP_EDIT_ROLES } from "@/lib/permissions";
import { canReadBuildingGraph } from "@/lib/access-control";
import { CreateFloorSchema } from "@/lib/validations/floor";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get("buildingId");
  if (!buildingId) return NextResponse.json({ error: "buildingId required" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const access = await canReadBuildingGraph(buildingId, session?.user?.id);
  if (!access.exists || !access.allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const floors = await db.floor.findMany({
    where: { buildingId },
    orderBy: { levelNumber: "asc" },
    include: { _count: { select: { nodes: true } } },
  });
  return NextResponse.json(floors);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CreateFloorSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const access = await canAccessBuilding(parsed.data.buildingId, session.user.id, MAP_EDIT_ROLES);
    if (!access.exists || !access.allowed) return NextResponse.json({ error: "Building not found" }, { status: 404 });

    const floor = await db.floor.create({ data: parsed.data });
    return NextResponse.json(floor, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
