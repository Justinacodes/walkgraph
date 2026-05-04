import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessOrg, ORG_WRITE_ROLES } from "@/lib/permissions";
import { CreateBuildingSchema } from "@/lib/validations/building";
import { generateSlug } from "@/lib/utils/slug";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("organizationId");
  const pub = searchParams.get("public");

  if (pub) {
    const buildings = await db.building.findMany({
      where: { status: "PUBLISHED", visibility: "PUBLIC" },
      include: { organization: { select: { name: true, slug: true } }, _count: { select: { nodes: true, floors: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return NextResponse.json(buildings);
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const buildings = await db.building.findMany({
    where: orgId
      ? { organizationId: orgId, organization: { OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }] } }
      : { organization: { OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }] } },
    include: { organization: { select: { name: true } }, _count: { select: { nodes: true, floors: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(buildings);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CreateBuildingSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { organizationId, name, description, address, latitude, longitude, category, imageUrl, visibility } = parsed.data;
    const slug = parsed.data.slug ?? generateSlug(name);

    const allowed = await canAccessOrg(organizationId, session.user.id, ORG_WRITE_ROLES);
    if (!allowed) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const building = await db.building.create({
      data: { organizationId, name, slug, description, address, latitude, longitude, category, imageUrl: imageUrl || null, visibility },
    });

    return NextResponse.json(building, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
