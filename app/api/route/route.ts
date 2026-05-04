import { NextResponse } from "next/server";
import { z } from "zod";
import { buildGraph } from "@/lib/routing/graph-builder";
import { dijkstra } from "@/lib/routing/dijkstra";

const RouteRequestSchema = z.object({
  buildingId: z.string().cuid(),
  fromNodeId: z.string().cuid(),
  toNodeId: z.string().cuid(),
  accessibilityMode: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RouteRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { buildingId, fromNodeId, toNodeId, accessibilityMode } = parsed.data;

    const { nodes, edges } = await buildGraph(buildingId);

    const result = dijkstra(nodes, edges, fromNodeId, toNodeId, { accessibilityMode });

    if (!result) {
      return NextResponse.json({ error: "No route found between these nodes" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
