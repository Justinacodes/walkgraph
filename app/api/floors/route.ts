import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateFloorSchema } from "@/lib/validations/floor";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get("buildingId");
  if (!buildingId) return NextResponse.json({ error: "buildingId required" }, { status: 400 });

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

    const building = await db.building.findFirst({
      where: { id: parsed.data.buildingId, organization: { ownerId: session.user.id } },
    });
    if (!building) return NextResponse.json({ error: "Building not found" }, { status: 404 });

    const floor = await db.floor.create({ data: parsed.data });
    return NextResponse.json(floor, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
