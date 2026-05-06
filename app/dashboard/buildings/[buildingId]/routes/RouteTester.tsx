"use client";
import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Navigation, ArrowRight, Clock, Ruler, Accessibility } from "lucide-react";
import { formatWalkTime, formatDistance } from "@/lib/utils/format";
interface Node {
  id: string;
  name: string;
  type: string;
  floor?: { name: string; levelNumber: number } | null;
}
interface RouteStep {
  fromNode: Node;
  toNode: Node;
  edge: {
    requiresStairs: boolean;
    requiresElevator: boolean;
    requiresRamp: boolean;
    directionHint: string | null;
    distanceEstimate: number | null;
    walkTimeEstimate: number | null;
  };
  instruction: string;
  floorChange: boolean;
  targetFloorName: string | null;
}
interface RouteResult {
  path: Node[];
  steps: RouteStep[];
  totalDistanceEstimate: number;
  totalWalkTimeEstimate: number;
  floorChanges: number;
  warnings: Array<{ code: string; message: string }>;
}
export function RouteTester({ buildingId, nodes }: { buildingId: string; nodes: Node[] }) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [accessible, setAccessible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState("");
  const nodeOptions = nodes.map((n) => ({
    value: n.id,
    label: `${n.name}${n.floor ? ` (${n.floor.name})` : ""}`,
  }));
  async function findRoute() {
    if (!fromId || !toId) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildingId, fromNodeId: fromId, toNodeId: toId, accessibilityMode: accessible, context: "admin" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No route found");
        return;
      }
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <PageHeader title="Route Tester" subtitle="Preview indoor navigation routes before publishing" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="space-y-4">
            <Select
              label="From"
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              options={nodeOptions}
              placeholder="Select starting point…"
            />
            <Select
              label="To"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              options={nodeOptions.filter((o) => o.value !== fromId)}
              placeholder="Select destination…"
            />
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accessible}
                onChange={(e) => setAccessible(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium flex items-center gap-2">
                <Accessibility className="w-4 h-4" />
                Accessibility mode (avoid stairs)
              </span>
            </label>
            <Button
              onClick={findRoute}
              loading={loading}
              disabled={!fromId || !toId}
              className="w-full"
              variant="blue"
            >
              <Navigation className="w-4 h-4" /> Find Route
            </Button>
          </div>
        </Card>
        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <div className="bg-[#141414] text-white rounded-3xl p-6">
                <p className="font-mono text-xs uppercase tracking-widest opacity-40 mb-3">Route Found</p>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <div className="flex items-center gap-1.5 text-sm opacity-60 mb-1">
                      <Ruler className="w-3 h-3" /> Distance
                    </div>
                    <p className="font-bold text-xl">{formatDistance(result.totalDistanceEstimate)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-sm opacity-60 mb-1">
                      <Clock className="w-3 h-3" /> Walk time
                    </div>
                    <p className="font-bold text-xl">{formatWalkTime(result.totalWalkTimeEstimate)}</p>
                  </div>
                  <div>
                    <div className="text-sm opacity-60 mb-1">Steps</div>
                    <p className="font-bold text-xl">{result.steps.length}</p>
                  </div>
                  <div>
                    <div className="text-sm opacity-60 mb-1">Floor changes</div>
                    <p className="font-bold text-xl">{result.floorChanges}</p>
                  </div>
                </div>
              </div>
              {result.warnings.length > 0 && (
                <div className="space-y-2" role="status" aria-live="polite">
                  {result.warnings.map((warning) => (
                    <div key={warning.code} className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl">
                      {warning.message}
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                {result.steps.length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 text-sm font-semibold">
                    {result.warnings[0]?.message ?? "You are already at this destination."}
                  </div>
                )}
                {result.steps.map((step, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{step.instruction}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                          <span>{step.fromNode.name}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span>{step.toNode.name}</span>
                        </div>
                        {(step.edge.requiresStairs || step.edge.requiresElevator || step.edge.requiresRamp || step.floorChange) && (
                          <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-lg">
                            {step.edge.requiresStairs ? "Stairs" : step.edge.requiresElevator ? "Elevator" : step.edge.requiresRamp ? "Ramp" : `Floor change${step.targetFloorName ? ` to ${step.targetFloorName}` : ""}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
