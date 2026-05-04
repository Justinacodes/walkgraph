"use client";

import { useState, useRef } from "react";
import { Search, Navigation, ArrowRight, Clock, Ruler, Accessibility, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatWalkTime, formatDistance } from "@/lib/utils/format";

interface Floor { id: string; name: string; levelNumber: number; }
interface Node {
  id: string; name: string; type: string;
  floor?: { name: string; levelNumber: number } | null;
}
interface RouteStep {
  fromNode: Node; toNode: Node;
  edge: { requiresStairs: boolean; requiresElevator: boolean; };
  instruction: string;
}
interface RouteResult {
  path: Node[]; steps: RouteStep[];
  totalDistanceEstimate: number; totalWalkTimeEstimate: number;
}

export function IndoorNavigator({
  buildingId, nodes, floors,
}: {
  buildingId: string; nodes: Node[]; floors: Floor[];
}) {
  const [search, setSearch] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [accessible, setAccessible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  const filtered = search.length > 0
    ? nodes.filter((n) =>
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.type.toLowerCase().includes(search.toLowerCase())
      )
    : nodes;

  async function navigate() {
    if (!fromId || !toId) return;
    setLoading(true);
    setError("");
    setRoute(null);
    setStep(0);

    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildingId, fromNodeId: fromId, toNodeId: toId, accessibilityMode: accessible }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "No route found");
        return;
      }
      setRoute(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Search & Form */}
      <div className="space-y-6">
        {/* Search */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <h2 className="font-bold text-lg mb-4">Find a Location</h2>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms, offices, restrooms…"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#141414] transition-colors"
            />
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filtered.slice(0, 10).map((node) => (
              <button
                key={node.id}
                onClick={() => setToId(node.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-sm transition-all",
                  toId === node.id
                    ? "bg-[#141414] text-white"
                    : "hover:bg-slate-50 text-[#141414]"
                )}
              >
                <span className="font-semibold">{node.name}</span>
                {node.floor && (
                  <span className={cn("ml-2 text-xs", toId === node.id ? "text-white/50" : "text-slate-400")}>
                    {node.floor.name}
                  </span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">No locations found</p>
            )}
          </div>
        </div>

        {/* Navigate form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6">
          <h2 className="font-bold text-lg mb-4">Get Directions</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">From</label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#141414] appearance-none"
              >
                <option value="">Select starting point…</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}{n.floor ? ` (${n.floor.name})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">To</label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#141414] appearance-none"
              >
                <option value="">Select destination…</option>
                {nodes.filter((n) => n.id !== fromId).map((n) => (
                  <option key={n.id} value={n.id}>{n.name}{n.floor ? ` (${n.floor.name})` : ""}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer py-2">
              <input type="checkbox" checked={accessible} onChange={(e) => setAccessible(e.target.checked)} className="rounded" />
              <span className="text-sm font-medium flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-blue-500" /> Accessible route (avoid stairs)
              </span>
            </label>

            <button
              onClick={navigate}
              disabled={!fromId || !toId || loading}
              className="w-full bg-[#3B82F6] text-white font-bold py-3.5 rounded-2xl hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              Get Directions
            </button>
          </div>
        </div>
      </div>

      {/* Right: Route result */}
      <div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
            {error}
          </div>
        )}

        {route && (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="bg-[#141414] text-white rounded-3xl p-6 relative overflow-hidden">
              <p className="font-mono text-xs opacity-40 uppercase tracking-widest mb-3">Route</p>
              <div className="flex gap-8">
                <div>
                  <div className="text-sm opacity-50 flex items-center gap-1 mb-1"><Ruler className="w-3 h-3" /> Distance</div>
                  <p className="text-2xl font-bold">{formatDistance(route.totalDistanceEstimate)}</p>
                </div>
                <div>
                  <div className="text-sm opacity-50 flex items-center gap-1 mb-1"><Clock className="w-3 h-3" /> Walk time</div>
                  <p className="text-2xl font-bold">{formatWalkTime(route.totalWalkTimeEstimate)}</p>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            </div>

            {/* Step-by-step */}
            <div className="space-y-2">
              {route.steps.map((s, i) => (
                <div
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    "rounded-2xl border p-4 cursor-pointer transition-all",
                    step === i
                      ? "bg-[#141414] text-white border-transparent"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("font-mono text-xs font-bold w-6 text-center shrink-0", step === i ? "opacity-40" : "text-slate-400")}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{s.instruction}</p>
                      <div className={cn("flex items-center gap-1 mt-0.5 text-xs", step === i ? "opacity-40" : "text-slate-400")}>
                        {s.fromNode.name} <ArrowRight className="w-3 h-3" /> {s.toNode.name}
                      </div>
                    </div>
                    {(s.edge.requiresStairs || s.edge.requiresElevator) && (
                      <span className={cn("ml-auto text-xs font-bold px-2 py-0.5 rounded-lg", step === i ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700")}>
                        {s.edge.requiresStairs ? "Stairs" : "Lift"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!route && !error && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
            <Navigation className="w-8 h-8 mx-auto mb-3" />
            <p className="font-medium">Choose a starting point and destination to get directions</p>
          </div>
        )}
      </div>
    </div>
  );
}
