import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdateEdgeSchema } from "@/lib/validations/edge";

export async function PATCH(req: Request, context: { params: Promise<{ edgeId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateEdgeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const updated = await db.edge.update({ where: { id: params.edgeId }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: { params: Promise<{ edgeId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.edge.delete({ where: { id: params.edgeId } });
  return NextResponse.json({ ok: true });
}
