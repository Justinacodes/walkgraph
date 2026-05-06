import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBuilding, MAP_EDIT_ROLES } from "@/lib/permissions";
import { buildCheckpointUrl, getShortCheckpointCode } from "@/lib/qr";

export async function POST(_: Request, context: { params: Promise<{ nodeId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const node = await db.node.findUnique({
    where: { id: params.nodeId },
    include: {
      building: { select: { id: true, name: true, organizationId: true } },
      floor: { select: { id: true, name: true, levelNumber: true, buildingId: true } },
    },
  });

  if (!node) {
    return NextResponse.json({ error: "Checkpoint node not found" }, { status: 404 });
  }

  const access = await canAccessBuilding(node.buildingId, session.user.id, MAP_EDIT_ROLES);
  if (!access.allowed) {
    return NextResponse.json({ error: access.exists ? "Forbidden" : "Not found" }, { status: access.exists ? 403 : 404 });
  }

  if (node.floor.buildingId !== node.buildingId || node.building.id !== node.buildingId) {
    return NextResponse.json({ error: "Checkpoint node is not linked to a valid building/floor" }, { status: 409 });
  }

  let checkpoint = await db.qRCheckpoint.findFirst({
    where: { nodeId: node.id, active: true },
    orderBy: { createdAt: "asc" },
  });

  if (checkpoint && (checkpoint.buildingId !== node.buildingId || checkpoint.floorId !== node.floorId)) {
    checkpoint = await db.qRCheckpoint.update({
      where: { id: checkpoint.id },
      data: {
        buildingId: node.buildingId,
        floorId: node.floorId,
        label: checkpoint.label ?? node.name,
      },
    });
  }

  if (!checkpoint) {
    checkpoint = await db.qRCheckpoint.create({
      data: {
        buildingId: node.buildingId,
        floorId: node.floorId,
        nodeId: node.id,
        label: node.name,
        active: true,
      },
    });
  }

  const qrData = buildCheckpointUrl(node.buildingId, checkpoint.code);
  const dataUrl = await QRCode.toDataURL(qrData, {
    width: 400,
    margin: 2,
    color: { dark: "#141414", light: "#FFFFFF" },
  });

  return NextResponse.json({
    dataUrl,
    code: checkpoint.code,
    shortCode: getShortCheckpointCode(checkpoint.code),
    qrData,
    building: { id: node.building.id, name: node.building.name },
    floor: { id: node.floor.id, name: node.floor.name, levelNumber: node.floor.levelNumber },
    node: { id: node.id, name: node.name, type: node.type },
    checkpoint: { id: checkpoint.id, label: checkpoint.label ?? node.name, active: checkpoint.active },
  });
}
