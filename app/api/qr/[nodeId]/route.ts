import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(req: Request, { params }: { params: { nodeId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const node = await db.node.findUnique({
    where: { id: params.nodeId },
    include: { building: true, floor: true },
  });
  if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let checkpoint = await db.qRCheckpoint.findFirst({ where: { nodeId: params.nodeId, active: true } });
  if (!checkpoint) {
    checkpoint = await db.qRCheckpoint.create({
      data: {
        buildingId: node.buildingId,
        floorId: node.floorId,
        nodeId: node.id,
        label: node.name,
      },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const qrData = `${appUrl}/navigate/${node.buildingId}?node=${checkpoint.code}`;

  const dataUrl = await QRCode.toDataURL(qrData, {
    width: 400,
    margin: 2,
    color: { dark: "#141414", light: "#FFFFFF" },
  });

  return NextResponse.json({ dataUrl, code: checkpoint.code, qrData, node: { id: node.id, name: node.name } });
}
