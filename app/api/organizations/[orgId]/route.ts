import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessOrg, ORG_WRITE_ROLES } from "@/lib/permissions";
import { UpdateOrgSchema } from "@/lib/validations/organization";

export async function GET(_: Request, context: { params: Promise<{ orgId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canAccessOrg(params.orgId, session.user.id);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

export async function PATCH(req: Request, context: { params: Promise<{ orgId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canAccessOrg(params.orgId, session.user.id, ORG_WRITE_ROLES);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateOrgSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const updated = await db.organization.update({ where: { id: params.orgId }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: { params: Promise<{ orgId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canAccessOrg(params.orgId, session.user.id, ["OWNER"]);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.organization.delete({ where: { id: params.orgId } });
  return NextResponse.json({ ok: true });
}
