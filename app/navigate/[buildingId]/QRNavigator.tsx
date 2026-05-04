"use client";

import { useState, useEffect } from "react";
import { Navigation, Search, MapPin, ChevronRight, ArrowRight, Clock, Ruler, Accessibility, RotateCcw, CheckCircle2 } from "lucide-react";
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

type Screen = "home" | "search" | "route";

const NODE_TYPE_ICONS: Record<string, string> = {
  ENTRANCE: "🚪", EXIT: "🚪", RESTROOM: "🚻", ELEVATOR: "🛗",
  STAIRCASE: "🪜", RECEPTION: "🛎", ROOM: "🏠", OFFICE: "💼",
  LECTURE_HALL: "🎓", LANDMARK: "📍", EMERGENCY_EXIT: "🚨",
  HALLWAY_POINT: "🔵", CORRIDOR_JUNCTION: "🔵", DOOR: "🚪", RAMP: "♿",
};

export function QRNavigator({
  buildingId, nodes, floors, currentNodeId,
}: {
  buildingId: string; nodes: Node[]; floors: Floor[]; currentNodeId: string | null;
}) {
  const [fromId, setFromId] = useState(currentNodeId ?? "");
  const [toId, setToId] = useState("");
  const [screen, setScreen] = useState<Screen>("home");
  const [searchTarget, setSearchTarget] = useState<"from" | "to">("to");
  const [query, setQuery] = useState("");
  const [accessible, setAccessible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);

  const fromNode = nodes.find((n) => n.id === fromId);
  const toNode = nodes.find((n) => n.id === toId);

  const filteredNodes = query
    ? nodes.filter((n) => n.name.toLowerCase().includes(query.toLowerCase()))
    : nodes;

  async function navigate() {
    if (!fromId || !toId) return;
    setLoading(true);
    setError("");
    setRoute(null);
    setActiveStep(0);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildingId, fromNodeId: fromId, toNodeId: toId, accessibilityMode: accessible }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "No route found");
        setScreen("home");
        return;
      }
      setRoute(await res.json());
      setScreen("route");
    } finally {
      setLoading(false);
    }
  }

  function pickNode(id: string) {
    if (searchTarget === "from") setFromId(id);
    else setToId(id);
    setQuery("");
    setScreen("home");
  }

  function reset() {
    setRoute(null);
    setError("");
    setToId("");
    setActiveStep(0);
    setScreen("home");
  }

  // ── Route screen ────────────────────────────────────────────────────────────
  if (screen === "route" && route) {
    const currentStep = route.steps[activeStep];
    const isLast = activeStep === route.steps.length - 1;
    return (
      <div className="flex flex-col min-h-[calc(100vh-120px)]">
        {/* Progress bar */}
        <div className="h-1 bg-slate-200">
          <div
            className="h-full bg-[#3B82F6] transition-all duration-500"
            style={{ width: `${((activeStep + 1) / route.steps.length) * 100}%` }}
          />
        </div>

        {/* Summary strip */}
        <div className="bg-[#1e293b] text-white px-5 py-4 flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Ruler className="w-3.5 h-3.5 opacity-50" />
            <span className="font-bold">{formatDistance(route.totalDistanceEstimate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-3.5 h-3.5 opacity-50" />
            <span className="font-bold">{formatWalkTime(route.totalWalkTimeEstimate)}</span>
          </div>
          <span className="ml-auto font-mono text-xs opacity-40">{activeStep + 1}/{route.steps.length}</span>
        </div>

        {/* Current step — big card */}
        <div className="flex-1 flex flex-col p-5 gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex-1 flex flex-col justify-center">
            <p className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-3">
              Step {activeStep + 1}
            </p>
            <p className="text-2xl font-bold text-[#141414] leading-tight mb-4">
              {currentStep.instruction}
            </p>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span>{currentStep.fromNode.name}</span>
              <ArrowRight className="w-4 h-4" />
              <span className="font-semibold text-[#141414]">{currentStep.toNode.name}</span>
            </div>
            {(currentStep.edge.requiresStairs || currentStep.edge.requiresElevator) && (
              <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-xl w-fit">
                {currentStep.edge.requiresElevator ? "🛗 Elevator" : "🪜 Stairs"}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
              disabled={activeStep === 0}
              className="flex-1 py-4 rounded-2xl border border-slate-200 font-semibold text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              ← Previous
            </button>
            {isLast ? (
              <button
                onClick={reset}
                className="flex-1 py-4 rounded-2xl bg-[#10b981] text-white font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Arrived!
              </button>
            ) : (
              <button
                onClick={() => setActiveStep((s) => s + 1)}
                className="flex-1 py-4 rounded-2xl bg-[#141414] text-white font-bold hover:bg-[#2d2d2d] transition-colors"
              >
                Next →
              </button>
            )}
          </div>

          {/* All steps collapsed */}
          <div className="space-y-1">
            {route.steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-sm",
                  i === activeStep ? "bg-[#141414] text-white" : i < activeStep ? "bg-slate-50 text-slate-400 line-through" : "bg-white border border-slate-200 text-slate-700"
                )}
              >
                <span className="font-mono text-xs w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium truncate">{s.instruction}</span>
                {i === activeStep && <ChevronRight className="w-4 h-4 ml-auto shrink-0 opacity-50" />}
              </button>
            ))}
          </div>

          <button onClick={reset} className="text-slate-400 text-sm flex items-center gap-2 justify-center py-2">
            <RotateCcw className="w-3.5 h-3.5" /> Start over
          </button>
        </div>
      </div>
    );
  }

  // ── Search screen ────────────────────────────────────────────────────────────
  if (screen === "search") {
    return (
      <div className="p-5">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${searchTarget === "from" ? "starting point" : "destination"}…`}
            className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#141414]"
          />
        </div>
        <button onClick={() => setScreen("home")} className="text-slate-400 text-sm mb-4 block">← Back</button>
        <div className="space-y-1">
          {filteredNodes.slice(0, 20).map((node) => (
            <button
              key={node.id}
              onClick={() => pickNode(node.id)}
              className="w-full text-left bg-white border border-slate-200 rounded-2xl px-4 py-4 flex items-center gap-3 hover:border-[#141414] transition-all"
            >
              <span className="text-xl">{NODE_TYPE_ICONS[node.type] ?? "📍"}</span>
              <div>
                <p className="font-semibold text-[#141414] text-sm">{node.name}</p>
                {node.floor && <p className="text-xs text-slate-400">{node.floor.name}</p>}
              </div>
            </button>
          ))}
          {filteredNodes.length === 0 && (
            <p className="text-center text-slate-400 py-8">No locations found</p>
          )}
        </div>
      </div>
    );
  }

  // ── Home screen ────────────────────────────────────────────────────────────
  return (
    <div className="p-5 space-y-4">
      {/* You are here banner */}
      {currentNodeId && fromNode && (
        <div className="bg-[#3B82F6] text-white rounded-2xl px-4 py-3 flex items-center gap-3">
          <MapPin className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-xs font-mono opacity-70">You are here</p>
            <p className="font-bold">{fromNode.name}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">{error}</div>
      )}

      {/* From / To selectors */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => { setSearchTarget("from"); setScreen("search"); }}
          className="w-full px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100"
        >
          <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 shrink-0" />
          <span className={cn("text-sm flex-1 text-left", fromId ? "text-[#141414] font-semibold" : "text-slate-400")}>
            {fromNode ? fromNode.name : "Set starting point"}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </button>
        <div className="h-px bg-slate-100 mx-5" />
        <button
          onClick={() => { setSearchTarget("to"); setScreen("search"); }}
          className="w-full px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
          <span className={cn("text-sm flex-1 text-left", toId ? "text-[#141414] font-semibold" : "text-slate-400")}>
            {toNode ? toNode.name : "Where do you want to go?"}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* Accessibility toggle */}
      <label className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-4 cursor-pointer">
        <Accessibility className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="text-sm font-medium flex-1">Accessible route (avoid stairs)</span>
        <div
          onClick={() => setAccessible((a) => !a)}
          className={cn(
            "w-11 h-6 rounded-full transition-colors relative",
            accessible ? "bg-[#3B82F6]" : "bg-slate-200"
          )}
        >
          <div className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
            accessible ? "translate-x-6" : "translate-x-1"
          )} />
        </div>
      </label>

      {/* Get directions button */}
      <button
        onClick={navigate}
        disabled={!fromId || !toId || loading}
        className="w-full bg-[#141414] text-white font-bold py-5 rounded-2xl disabled:opacity-40 flex items-center justify-center gap-3 text-base"
      >
        {loading ? (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <Navigation className="w-5 h-5" />
        )}
        Get Directions
      </button>

      {/* Quick-pick popular destinations */}
      {!toId && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Popular destinations</p>
          <div className="grid grid-cols-2 gap-2">
            {nodes
              .filter((n) => ["ENTRANCE", "EXIT", "RESTROOM", "ELEVATOR", "RECEPTION"].includes(n.type))
              .slice(0, 6)
              .map((n) => (
                <button
                  key={n.id}
                  onClick={() => setToId(n.id)}
                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-left hover:border-[#141414] transition-all"
                >
                  <span className="text-lg block mb-1">{NODE_TYPE_ICONS[n.type]}</span>
                  <p className="text-sm font-semibold text-[#141414] truncate">{n.name}</p>
                  {n.floor && <p className="text-xs text-slate-400">{n.floor.name}</p>}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
