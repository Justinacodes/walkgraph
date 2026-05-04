import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdateOrgSchema } from "@/lib/validations/organization";

async function getOrg(orgId: string, userId: string) {
  return db.organization.findFirst({ where: { id: orgId, ownerId: userId } });
}

export async function GET(_: Request, { params }: { params: { orgId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await db.organization.findFirst({
    where: { id: params.orgId },
    include: {
      buildings: { orderBy: { createdAt: "desc" } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { buildings: true, members: true } },
    },
  });

  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(org);
}

export async function PATCH(req: Request, { params }: { params: { orgId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrg(params.orgId, session.user.id);
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateOrgSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const updated = await db.organization.update({ where: { id: params.orgId }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { orgId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrg(params.orgId, session.user.id);
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.organization.delete({ where: { id: params.orgId } });
  return NextResponse.json({ ok: true });
}
