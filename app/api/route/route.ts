import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBuilding, MAP_EDIT_ROLES } from "@/lib/permissions";
import { buildGraph } from "@/lib/routing/graph-builder";
import { dijkstra } from "@/lib/routing/dijkstra";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const RouteRequestSchema = z.object({
  buildingId: z.string().cuid(),
  fromNodeId: z.string().cuid(),
  toNodeId: z.string().cuid(),
  accessibilityMode: z.boolean().optional().default(false),
  context: z.enum(["admin", "visitor"]).optional().default("visitor"),
});

export async function POST(req: Request) {
  const limited = rateLimit(`route:${getClientIp(req)}`, 120, 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many route requests. Try again shortly." }, { status: 429, headers: rateLimitHeaders(limited) });
  }

  try {
    const body = await req.json();
    const parsed = RouteRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { buildingId, fromNodeId, toNodeId, accessibilityMode, context } = parsed.data;
    const building = await db.building.findUnique({ where: { id: buildingId }, select: { id: true, status: true, visibility: true } });
    if (!building) return NextResponse.json({ error: "Building is unavailable" }, { status: 404 });

    if (context === "visitor") {
      if (building.status !== "PUBLISHED" || building.visibility !== "PUBLIC") {
        return NextResponse.json({ error: "Building is unavailable" }, { status: 404 });
      }
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const access = await canAccessBuilding(buildingId, session.user.id, MAP_EDIT_ROLES);
      if (!access.allowed) return NextResponse.json({ error: "Building is unavailable" }, { status: 404 });
    }

    const { nodes, edges, floors } = await buildGraph(buildingId);
    const fromNode = nodes.find((node) => node.id === fromNodeId);
    const toNode = nodes.find((node) => node.id === toNodeId);

    if (!fromNode || !toNode) return NextResponse.json({ error: "Start or destination is outside this building" }, { status: 400 });
    if (fromNode.restricted || toNode.restricted) return NextResponse.json({ error: "Start or destination is restricted" }, { status: 400 });
    if (context === "visitor" && (!fromNode.searchable || !toNode.searchable)) {
      return NextResponse.json({ error: "Start or destination is unavailable for public navigation" }, { status: 400 });
    }

    const result = dijkstra(nodes, edges, floors, fromNodeId, toNodeId, { accessibilityMode });
    if (!result) {
      return NextResponse.json(
        { error: accessibilityMode ? "No accessible route found. Try another start point or ask an admin to review elevator/ramp connections." : "No route found between these nodes. Try another start point or ask an admin to review the graph." },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
