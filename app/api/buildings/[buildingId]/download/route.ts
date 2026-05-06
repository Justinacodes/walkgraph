import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildOfflinePackage, readSnapshotVersion } from "@/lib/offline-package";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(req: Request, context: { params: Promise<{ buildingId: string }> }) {
  const limited = rateLimit(`offline-download:${getClientIp(req)}`, 60, 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many download requests. Try again shortly." }, { status: 429, headers: rateLimitHeaders(limited) });
  }

  const params = await context.params;
  const building = await db.building.findFirst({
    where: { id: params.buildingId, status: "PUBLISHED", visibility: "PUBLIC" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      address: true,
      latitude: true,
      longitude: true,
      category: true,
      updatedAt: true,
      floors: {
        orderBy: { levelNumber: "asc" },
        select: { id: true, buildingId: true, name: true, levelNumber: true, description: true, accessibilityNotes: true },
      },
      nodes: {
        select: {
          id: true,
          buildingId: true,
          floorId: true,
          name: true,
          type: true,
          description: true,
          x: true,
          y: true,
          searchable: true,
          tags: true,
          aliases: true,
          accessibilityFlags: true,
          restricted: true,
        },
      },
      edges: {
        select: {
          id: true,
          buildingId: true,
          fromNodeId: true,
          toNodeId: true,
          distanceEstimate: true,
          walkTimeEstimate: true,
          directionHint: true,
          accessible: true,
          requiresStairs: true,
          requiresElevator: true,
          requiresRamp: true,
          restricted: true,
          oneWay: true,
        },
      },
      qrCheckpoints: {
        where: { active: true },
        select: { code: true, label: true, buildingId: true, floorId: true, nodeId: true, active: true },
      },
      mapVersions: {
        where: { status: "PUBLISHED" },
        orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: { versionNumber: true, publishedAt: true, snapshotJson: true },
      },
    },
  });

  if (!building) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const latestVersion = building.mapVersions[0];
  const snapshotVersion = latestVersion ? readSnapshotVersion(latestVersion.snapshotJson) : null;
  const packageVersion = snapshotVersion ?? latestVersion?.versionNumber ?? Math.max(1, Math.floor(building.updatedAt.getTime() / 1000));

  return NextResponse.json(
    buildOfflinePackage({
      building,
      packageVersion,
      publishedAt: latestVersion?.publishedAt ?? null,
      source: latestVersion ? "mapVersion" : "generated",
    }),
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  );
}
