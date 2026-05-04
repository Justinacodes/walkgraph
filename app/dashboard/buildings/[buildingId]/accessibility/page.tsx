import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, Accessibility, ArrowRight } from "lucide-react";

export default async function AccessibilityAuditPage({ params }: { params: { buildingId: string } }) {
  const building = await db.building.findUnique({
    where: { id: params.buildingId },
    include: {
      floors: { orderBy: { levelNumber: "asc" } },
      nodes: { include: { floor: { select: { name: true, levelNumber: true } } } },
      edges: {
        include: {
          fromNode: { select: { id: true, name: true, floorId: true } },
          toNode: { select: { id: true, name: true, floorId: true } },
        },
      },
    },
  });

  if (!building) notFound();

  const { nodes, edges, floors } = building;

  // ── Compute metrics ────────────────────────────────────────────────────────

  const totalEdges = edges.length;
  const accessibleEdges = edges.filter((e) => e.accessible && !e.requiresStairs && !e.restricted).length;
  const stairsOnlyEdges = edges.filter((e) => e.requiresStairs && !e.requiresElevator).length;
  const restrictedEdges = edges.filter((e) => e.restricted).length;
  const crossFloorEdges = edges.filter((e) => e.fromNode.floorId !== e.toNode.floorId);
  const elevatorCrossFloor = crossFloorEdges.filter((e) => e.requiresElevator).length;
  const stairsCrossFloor = crossFloorEdges.filter((e) => e.requiresStairs && !e.requiresElevator).length;

  const accessibilityScore = totalEdges > 0 ? Math.round((accessibleEdges / totalEdges) * 100) : 0;

  const hasElevator = nodes.some((n) => n.type === "ELEVATOR");
  const hasRamp = nodes.some((n) => n.type === "RAMP");
  const hasAccessibleEntrance = edges.some((e) => {
    const fromEntrance = nodes.find((n) => n.id === e.fromNodeId && (n.type === "ENTRANCE" || n.type === "RAMP"));
    return fromEntrance && e.accessible && !e.requiresStairs;
  });

  // Nodes with no accessible path in or out
  const isolatedForAccessibility = nodes.filter((n) => {
    const connected = edges.filter((e) => e.fromNodeId === n.id || e.toNodeId === n.id);
    return connected.length > 0 && connected.every((e) => e.requiresStairs && !e.requiresElevator);
  });

  // Floors with no elevator/ramp cross-floor edge
  const floorAccessibility = floors.map((floor) => {
    const floorNodes = nodes.filter((n) => n.floorId === floor.id);
    const floorCrossEdges = crossFloorEdges.filter(
      (e) => e.fromNode.floorId === floor.id || e.toNode.floorId === floor.id
    );
    const hasAccessibleCrossFloor = floorCrossEdges.some((e) => e.requiresElevator || e.requiresRamp);
    const hasStairsOnlyCrossFloor = floorCrossEdges.some((e) => e.requiresStairs && !e.requiresElevator);
    return {
      floor,
      nodeCount: floorNodes.length,
      hasAccessibleCrossFloor,
      hasStairsOnlyCrossFloor,
      crossFloorEdgeCount: floorCrossEdges.length,
    };
  });

  // Issues list
  const issues: { level: "error" | "warning" | "ok"; message: string }[] = [];

  if (!hasElevator && floors.length > 1) issues.push({ level: "error", message: "No elevator nodes — wheelchair users cannot access multiple floors" });
  if (!hasRamp && !hasAccessibleEntrance) issues.push({ level: "warning", message: "No ramp or accessible entrance node detected" });
  if (stairsOnlyEdges > 0) issues.push({ level: "warning", message: `${stairsOnlyEdges} path(s) require stairs with no accessible alternative` });
  if (isolatedForAccessibility.length > 0) issues.push({ level: "error", message: `${isolatedForAccessibility.length} location(s) are only reachable via stairs` });
  if (stairsCrossFloor > 0 && elevatorCrossFloor === 0) issues.push({ level: "error", message: "Cross-floor connections exist but none are via elevator — multi-floor accessibility is blocked" });
  if (accessibilityScore === 100) issues.push({ level: "ok", message: "All mapped paths are accessible — great work!" });
  else if (accessibilityScore >= 80) issues.push({ level: "ok", message: `${accessibilityScore}% of paths are accessible` });

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-1">Accessibility Audit</h2>
        <p className="text-slate-500 text-sm">Review your building&apos;s accessibility coverage and find gaps that would prevent wheelchair users from navigating.</p>
      </div>

      {/* Score card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#141414] text-white rounded-3xl p-6 md:col-span-1 flex flex-col justify-between">
          <p className="font-mono text-xs opacity-40 uppercase tracking-widest">Accessibility Score</p>
          <div>
            <p className="text-5xl sm:text-6xl font-bold mt-4">{accessibilityScore}<span className="text-2xl sm:text-3xl opacity-40">%</span></p>
            <p className="text-sm opacity-50 mt-2">of paths are wheelchair-accessible</p>
          </div>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {[
            { label: "Total paths", value: totalEdges, sub: "mapped connections" },
            { label: "Accessible", value: accessibleEdges, sub: "no stairs required" },
            { label: "Stairs only", value: stairsOnlyEdges, sub: "blocks wheelchair access" },
            { label: "Elevator links", value: elevatorCrossFloor, sub: "cross-floor accessible" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#141414]">{value}</p>
              <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Issues */}
      <div>
        <h3 className="font-bold text-lg mb-4">Issues & Recommendations</h3>
        <div className="space-y-3">
          {issues.length === 0 && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 px-5 py-4 text-slate-500 text-sm">
              Add nodes and edges to generate accessibility recommendations.
            </div>
          )}
          {issues.map((issue, i) => (
            <div
              key={i}
              className={`rounded-2xl border px-5 py-4 flex items-start gap-3 ${
                issue.level === "error" ? "bg-red-50 border-red-200"
                  : issue.level === "warning" ? "bg-amber-50 border-amber-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              {issue.level === "error" ? <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                : issue.level === "warning" ? <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                : <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
              <p className={`text-sm font-medium ${
                issue.level === "error" ? "text-red-700"
                  : issue.level === "warning" ? "text-amber-700"
                  : "text-green-700"
              }`}>{issue.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-floor breakdown */}
      {floorAccessibility.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-4">Floor-by-Floor Breakdown</h3>
          <div className="space-y-3">
            {floorAccessibility.map(({ floor, nodeCount, hasAccessibleCrossFloor, hasStairsOnlyCrossFloor, crossFloorEdgeCount }) => {
              const isGroundFloor = floor.levelNumber === 0 || floor.levelNumber === 1;
              const status = isGroundFloor
                ? "ok"
                : hasAccessibleCrossFloor ? "ok"
                : hasStairsOnlyCrossFloor ? "error"
                : crossFloorEdgeCount === 0 ? "warning"
                : "ok";
              return (
                <div key={floor.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    status === "ok" ? "bg-green-50" : status === "error" ? "bg-red-50" : "bg-amber-50"
                  }`}>
                    {status === "ok"
                      ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                      : status === "error" ? <XCircle className="w-5 h-5 text-red-500" />
                      : <AlertTriangle className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#141414]">{floor.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {nodeCount} nodes
                      {!isGroundFloor && crossFloorEdgeCount === 0 && " — no cross-floor connections"}
                      {!isGroundFloor && hasAccessibleCrossFloor && " — elevator/ramp access available ✓"}
                      {!isGroundFloor && !hasAccessibleCrossFloor && hasStairsOnlyCrossFloor && " — stairs only, no elevator link"}
                    </p>
                  </div>
                  {!isGroundFloor && !hasAccessibleCrossFloor && (
                    <span className="text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-lg shrink-0">
                      Add elevator link
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Isolated nodes */}
      {isolatedForAccessibility.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Inaccessible Locations ({isolatedForAccessibility.length})
          </h3>
          <p className="text-sm text-slate-500 mb-3">These locations can only be reached via stairs. Add an accessible alternative path or elevator connection.</p>
          <div className="space-y-2">
            {isolatedForAccessibility.map((n) => (
              <div key={n.id} className="bg-white border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="font-semibold text-sm text-[#141414]">{n.name}</span>
                <span className="text-xs text-slate-400">
                  {n.floor ? `${n.floor.name}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      <div>
        <h3 className="font-bold text-lg mb-4">Accessibility Checklist</h3>
        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100">
          {[
            { check: hasElevator, label: "Elevator node exists", detail: "Add a node of type ELEVATOR" },
            { check: hasRamp, label: "Ramp node exists", detail: "Add a node of type RAMP for ground-level accessible entry" },
            { check: hasAccessibleEntrance, label: "Accessible entrance connected", detail: "An ENTRANCE or RAMP node has an accessible edge" },
            { check: elevatorCrossFloor > 0, label: "Elevator cross-floor connections", detail: "Use Cross-Floor Edge tool to link elevator nodes across floors" },
            { check: stairsOnlyEdges === 0, label: "No stairs-only paths", detail: "Every stairs edge should have an accessible alternative" },
            { check: isolatedForAccessibility.length === 0, label: "All locations are accessible", detail: "Every location has at least one path that doesn't require stairs" },
          ].map(({ check, label, detail }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-4">
              {check
                ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                : <XCircle className="w-5 h-5 text-slate-200 shrink-0" />}
              <div>
                <p className={`text-sm font-semibold ${check ? "text-[#141414]" : "text-slate-400"}`}>{label}</p>
                {!check && <p className="text-xs text-slate-400 mt-0.5">{detail}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
