import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateOrgSchema } from "@/lib/validations/organization";
import { generateSlug } from "@/lib/utils/slug";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgs = await db.organization.findMany({
    where: { ownerId: session.user.id },
    include: { _count: { select: { buildings: true, members: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orgs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CreateOrgSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { name, logoUrl, visibility } = parsed.data;
    const slug = parsed.data.slug ?? generateSlug(name);

    const existing = await db.organization.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug already taken" }, { status: 400 });

    const org = await db.organization.create({
      data: { name, slug, logoUrl: logoUrl || null, ownerId: session.user.id, visibility },
    });

    return NextResponse.json(org, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
