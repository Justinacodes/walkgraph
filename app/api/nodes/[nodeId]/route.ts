import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdateNodeSchema } from "@/lib/validations/node";

export async function GET(_: Request, { params }: { params: { nodeId: string } }) {
  const node = await db.node.findUnique({
    where: { id: params.nodeId },
    include: {
      floor: { select: { name: true, levelNumber: true } },
      edgesFrom: { include: { toNode: { select: { id: true, name: true, type: true } } } },
      edgesTo: { include: { fromNode: { select: { id: true, name: true, type: true } } } },
      qrCheckpoints: true,
    },
  });
  if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(node);
}

export async function PATCH(req: Request, { params }: { params: { nodeId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateNodeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const updated = await db.node.update({ where: { id: params.nodeId }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { nodeId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.node.delete({ where: { id: params.nodeId } });
  return NextResponse.json({ ok: true });
}
