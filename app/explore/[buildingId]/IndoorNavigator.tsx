"use client";

import { useEffect, useState } from "react";
import {
  Search, Navigation, ArrowRight, Clock, Ruler,
  Accessibility, ChevronRight, MapPin, CheckCircle2, RotateCcw, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatWalkTime, formatDistance } from "@/lib/utils/format";
import { loadOfflinePackage, routeOffline, searchOfflineNodes } from "@/lib/offline-browser";
import type { OfflineBuildingPackage } from "@/lib/offline-package";

interface Floor { id: string; name: string; levelNumber: number; }
interface Node {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  aliases?: string[];
  tags?: string[];
  searchable?: boolean;
  floor?: { name: string; levelNumber: number } | null;
}
interface RouteStep {
  fromNode: Node;
  toNode: Node;
  edge: { requiresStairs: boolean; requiresElevator: boolean; requiresRamp?: boolean };
  instruction: string;
  floorChange?: boolean;
  targetFloorName?: string | null;
}
interface RouteWarning {
  code: string;
  message: string;
}
interface RouteResult {
  path: Node[];
  steps: RouteStep[];
  totalDistanceEstimate: number;
  totalWalkTimeEstimate: number;
  floorChanges?: number;
  warnings?: RouteWarning[];
}

const TYPE_ICONS: Record<string, string> = {
  ENTRANCE: "🚪", EXIT: "🚪", RESTROOM: "🚻", ELEVATOR: "🛗",
  STAIRCASE: "🪜", RECEPTION: "🛎", ROOM: "🏠", OFFICE: "💼",
  LECTURE_HALL: "🎓", LANDMARK: "📍", EMERGENCY_EXIT: "🚨",
  HALLWAY_POINT: "🔵", CORRIDOR_JUNCTION: "🔵", DOOR: "🚪", RAMP: "♿",
};

const QUICK_TYPES = ["RESTROOM", "ELEVATOR", "EXIT", "RECEPTION", "ENTRANCE"];

export function IndoorNavigator({
  buildingId, nodes, floors,
}: {
  buildingId: string; nodes: Node[]; floors: Floor[];
}) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [accessible, setAccessible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState<"from" | "to">("to");
  const [query, setQuery] = useState("");
  const [offlinePackage, setOfflinePackage] = useState<OfflineBuildingPackage | null>(null);
  const [offlineNotice, setOfflineNotice] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    loadOfflinePackage(buildingId)
      .then((pkg) => {
        setOfflinePackage(pkg);
        if (!isOnline && pkg) setOfflineNotice("Offline mode: using the downloaded building package in this browser.");
      })
      .catch(() => setOfflineNotice("Offline storage is unavailable in this browser session."));
  }, [buildingId, isOnline]);

  const offlineNodes: Node[] = offlinePackage?.nodes.map((node) => ({
    ...node,
    floor: offlinePackage.floors.find((floor) => floor.id === node.floorId) ?? null,
  })) ?? [];
  const publicOfflineNodes = offlineNodes.filter((node) => node.searchable !== false);
  const displayNodes = offlinePackage && !isOnline ? publicOfflineNodes : nodes;
  const fromNode = displayNodes.find((n) => n.id === fromId);
  const toNode = displayNodes.find((n) => n.id === toId);
  const filtered = offlinePackage && !isOnline
    ? searchOfflineNodes(offlinePackage, query).map((node) => ({ ...node, floor: offlinePackage.floors.find((floor) => floor.id === node.floorId) ?? null }))
    : query
      ? displayNodes.filter((n) => {
          const haystack = [n.name, n.description, ...(n.aliases ?? []), ...(n.tags ?? []), n.floor?.name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(query.toLowerCase());
        })
      : displayNodes;

  async function navigate() {
    if (!fromId || !toId) return;
    setLoading(true);
    setError("");
    setRoute(null);
    setActiveStep(0);
    try {
      if (!isOnline && offlinePackage) {
        const offlineRoute = routeOffline(offlinePackage, fromId, toId, { accessibilityMode: accessible });
        if (!offlineRoute) {
          setError(accessible ? "No accessible offline route found in the downloaded package." : "No offline route found in the downloaded package.");
          return;
        }
        setRoute(offlineRoute);
        setOfflineNotice("Route calculated from the downloaded package. Offline data may be stale.");
        return;
      }
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

  function openSearch(target: "from" | "to") {
    setSearchTarget(target);
    setQuery("");
    setSearchOpen(true);
  }

  function pickNode(id: string) {
    if (searchTarget === "from") setFromId(id);
    else setToId(id);
    setSearchOpen(false);
  }

  function reset() {
    setRoute(null);
    setError("");
    setFromId("");
    setToId("");
    setActiveStep(0);
  }

  // ── Route view ───────────────────────────────────────────────────────────────
  if (route) {
    if (route.steps.length === 0) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <p className="text-xl font-bold text-[#141414] mb-2">You&apos;re already there</p>
            <p className="text-sm text-slate-500 mb-4">{route.warnings?.[0]?.message ?? "Start and destination are the same."}</p>
            <button onClick={reset} className="inline-flex items-center gap-2 text-sm font-semibold text-[#141414]">
              <RotateCcw className="w-4 h-4" /> Choose another route
            </button>
          </div>
        </div>
      );
    }

    const step = route.steps[activeStep];
    const isLast = activeStep === route.steps.length - 1;
    return (
      <div className="space-y-6">
        {route.warnings?.length ? (
          <div className="space-y-2">
            {route.warnings.map((warning) => (
              <div
                key={warning.code}
                className={cn(
                  "rounded-2xl px-5 py-4 text-sm border",
                  warning.code === "ACCESSIBLE_ROUTE"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                )}
              >
                {warning.message}
              </div>
            ))}
          </div>
        ) : null}

        {/* Summary */}
        <div className="bg-[#141414] text-white rounded-3xl p-6 flex gap-8 relative overflow-hidden">
          <div>
            <p className="text-xs opacity-40 uppercase tracking-widest mb-1 flex items-center gap-1"><Ruler className="w-3 h-3" /> Distance</p>
            <p className="text-3xl font-bold">{formatDistance(route.totalDistanceEstimate)}</p>
          </div>
          <div>
            <p className="text-xs opacity-40 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Walk time</p>
            <p className="text-3xl font-bold">{formatWalkTime(route.totalWalkTimeEstimate)}</p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Step navigator */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          {/* Progress */}
          <div className="h-1.5 bg-slate-100">
            <div className="h-full bg-[#3B82F6] transition-all" style={{ width: `${((activeStep + 1) / route.steps.length) * 100}%` }} />
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-slate-400">Step {activeStep + 1} of {route.steps.length}</span>
              {(step.edge.requiresStairs || step.edge.requiresElevator || step.edge.requiresRamp || step.floorChange) && (
                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                  {step.edge.requiresElevator ? "🛗 Elevator" : step.edge.requiresStairs ? "🪜 Stairs" : step.edge.requiresRamp ? "♿ Ramp" : "⇅ Floor change"}
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-[#141414] mb-3">{step.instruction}</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{step.fromNode.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-[#141414]">{step.toNode.name}</span>
            </div>
          </div>

          <div className="flex border-t border-slate-100">
            <button
              onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
              disabled={activeStep === 0}
              className="flex-1 py-4 text-sm font-semibold text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-colors border-r border-slate-100"
            >
              ← Prev
            </button>
            {isLast ? (
              <button
                onClick={reset}
                className="flex-1 py-4 text-sm font-bold text-[#10b981] flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Arrived!
              </button>
            ) : (
              <button
                onClick={() => setActiveStep((s) => s + 1)}
                className="flex-1 py-4 text-sm font-bold text-[#141414] hover:bg-slate-50 transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        </div>

        {/* All steps */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">All steps</p>
          <div className="space-y-2">
            {route.steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={cn(
                  "w-full text-left rounded-2xl px-4 py-3 flex items-center gap-3 transition-all text-sm",
                  i === activeStep ? "bg-[#141414] text-white" : i < activeStep ? "bg-slate-50 text-slate-400" : "bg-white border border-slate-200 text-[#141414]"
                )}
              >
                <span className={cn("font-mono text-xs w-5 shrink-0", i === activeStep ? "opacity-40" : "")}>{String(i + 1).padStart(2, "0")}</span>
                <span className={cn("flex-1 truncate", i < activeStep && "line-through")}>{s.instruction}</span>
                {i === activeStep && <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <button onClick={reset} className="flex items-center gap-2 text-slate-400 text-sm mx-auto">
          <RotateCcw className="w-3.5 h-3.5" /> Start over
        </button>
      </div>
    );
  }

  // ── Planner view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {offlineNotice && <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">{offlineNotice}</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* From / To card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => openSearch("from")}
          className="w-full px-6 py-5 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b border-slate-100"
        >
          <div className="w-3 h-3 rounded-full border-2 border-slate-400 shrink-0" />
          <span className={cn("flex-1 text-left text-sm", fromId ? "font-semibold text-[#141414]" : "text-slate-400")}>
            {fromNode ? fromNode.name : "Set starting point"}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
        </button>
        <div className="h-px bg-slate-100 mx-6" />
        <button
          onClick={() => openSearch("to")}
          className="w-full px-6 py-5 flex items-center gap-4 hover:bg-slate-50 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
          <span className={cn("flex-1 text-left text-sm", toId ? "font-semibold text-[#141414]" : "text-slate-400")}>
            {toNode ? toNode.name : "Where do you want to go?"}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
        </button>
      </div>

      {/* Accessibility */}
      <label className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 px-6 py-4 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500">
        <Accessibility className="w-5 h-5 text-blue-500 shrink-0" />
        <span className="text-sm font-medium flex-1">Accessible route (avoid stairs)</span>
        <input
          type="checkbox"
          checked={accessible}
          onChange={(e) => setAccessible(e.target.checked)}
          className="sr-only"
          aria-label="Accessible route, avoid stairs"
        />
        <span
          aria-hidden="true"
          className={cn("w-12 h-6 rounded-full transition-colors relative shrink-0", accessible ? "bg-[#3B82F6]" : "bg-slate-200")}
        >
          <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform", accessible ? "translate-x-7" : "translate-x-1")} />
        </span>
      </label>

      {/* Go button */}
      <button
        onClick={navigate}
        disabled={!fromId || !toId || loading}
        className="w-full bg-[#141414] text-white font-bold py-5 rounded-2xl disabled:opacity-40 flex items-center justify-center gap-3 text-base hover:bg-[#2d2d2d] transition-colors"
      >
        {loading ? (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : <Navigation className="w-5 h-5" />}
        Get Directions
      </button>

      {/* Quick access */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick access</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {displayNodes
            .filter((n) => QUICK_TYPES.includes(n.type))
            .slice(0, 6)
            .map((n) => (
              <button
                key={n.id}
                onClick={() => setToId(n.id)}
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left transition-all",
                  toId === n.id ? "border-[#141414] bg-[#141414] text-white" : "border-slate-200 bg-white hover:border-[#141414]"
                )}
              >
                <span className="text-2xl block mb-1">{TYPE_ICONS[n.type] ?? "📍"}</span>
                <p className={cn("text-sm font-semibold truncate", toId === n.id ? "text-white" : "text-[#141414]")}>{n.name}</p>
                {n.floor && <p className={cn("text-xs", toId === n.id ? "text-white/50" : "text-slate-400")}>{n.floor.name}</p>}
              </button>
            ))}
        </div>
      </div>

      {/* All locations */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">All locations</p>
        <div className="space-y-1">
          {displayNodes.slice(0, 12).map((n) => (
            <button
              key={n.id}
              onClick={() => setToId(n.id)}
              className={cn(
                "w-full text-left rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-all",
                toId === n.id ? "bg-[#141414] border-transparent text-white" : "bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              <span className="text-lg shrink-0">{TYPE_ICONS[n.type] ?? "📍"}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{n.name}</p>
                {n.floor && (
                  <p className={cn("text-xs", toId === n.id ? "opacity-50" : "text-slate-400")}>{n.floor.name}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${searchTarget === "from" ? "starting point" : "destination"}…`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#141414]"
                />
              </div>
              <button onClick={() => setSearchOpen(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-3">
              {filtered.slice(0, 30).map((n) => (
                <button
                  key={n.id}
                  onClick={() => pickNode(n.id)}
                  className="w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xl shrink-0">{TYPE_ICONS[n.type] ?? "📍"}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#141414]">{n.name}</p>
                    {n.floor && <p className="text-xs text-slate-400">{n.floor.name}</p>}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-slate-400 py-8 text-sm">No locations found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
