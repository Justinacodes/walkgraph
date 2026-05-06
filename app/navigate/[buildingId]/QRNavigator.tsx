"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Accessibility,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  QrCode,
  RotateCcw,
  Ruler,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDistance, formatWalkTime } from "@/lib/utils/format";
import { loadOfflinePackage, resolveOfflineCheckpoint, routeOffline, searchOfflineNodes } from "@/lib/offline-browser";
import type { OfflineBuildingPackage } from "@/lib/offline-package";

interface Floor { id: string; name: string; levelNumber: number; }
interface Node {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  aliases?: string[];
  tags?: string[];
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
interface RouteWarning { code: string; message: string; }
interface RouteResult {
  path: Node[];
  steps: RouteStep[];
  totalDistanceEstimate: number;
  totalWalkTimeEstimate: number;
  floorChanges?: number;
  warnings?: RouteWarning[];
}
interface QRResolution {
  status: "idle" | "resolved" | "inactive" | "invalid";
  requestedCode: string | null;
  message: string | null;
  checkpointLabel?: string | null;
}

type Screen = "home" | "search" | "route";

const NODE_TYPE_ICONS: Record<string, string> = {
  ENTRANCE: "🚪", EXIT: "🚪", RESTROOM: "🚻", ELEVATOR: "🛗",
  STAIRCASE: "🪜", RECEPTION: "🛎", ROOM: "🏠", OFFICE: "💼",
  LECTURE_HALL: "🎓", LANDMARK: "📍", EMERGENCY_EXIT: "🚨",
  HALLWAY_POINT: "🔵", CORRIDOR_JUNCTION: "🔵", DOOR: "🚪", RAMP: "♿",
};

export function QRNavigator({
  buildingId,
  nodes,
  currentNodeId,
  qrResolution,
}: {
  buildingId: string;
  nodes: Node[];
  floors: Floor[];
  currentNodeId: string | null;
  qrResolution: QRResolution;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [manualCode, setManualCode] = useState(qrResolution.requestedCode ?? "");
  const [offlinePackage, setOfflinePackage] = useState<OfflineBuildingPackage | null>(null);
  const [offlineNotice, setOfflineNotice] = useState("");

  useEffect(() => {
    setFromId(currentNodeId ?? "");
  }, [currentNodeId]);

  useEffect(() => {
    loadOfflinePackage(buildingId)
      .then((pkg) => {
        setOfflinePackage(pkg);
        if (!navigator.onLine && pkg) setOfflineNotice("Offline mode: using the downloaded building package in this browser.");
      })
      .catch(() => setOfflineNotice("Offline storage is unavailable in this browser session."));
  }, [buildingId]);

  useEffect(() => {
    setManualCode(qrResolution.requestedCode ?? "");
    if (qrResolution.status === "inactive" || qrResolution.status === "invalid") {
      setFromId("");
      setRoute(null);
      setScreen("home");
    }
  }, [qrResolution]);

  const offlineNodes: Node[] = offlinePackage?.nodes.map((node) => ({
    ...node,
    floor: offlinePackage.floors.find((floor) => floor.id === node.floorId) ?? null,
  })) ?? [];
  const displayNodes = offlinePackage && !navigator.onLine ? offlineNodes : nodes;
  const fromNode = displayNodes.find((n) => n.id === fromId);
  const toNode = displayNodes.find((n) => n.id === toId);

  const filteredNodes = offlinePackage && !navigator.onLine
    ? searchOfflineNodes(offlinePackage, query).map((node) => ({ ...node, floor: offlinePackage.floors.find((floor) => floor.id === node.floorId) ?? null }))
    : query
      ? displayNodes.filter((n) => [n.name, n.description, ...(n.aliases ?? []), ...(n.tags ?? []), n.floor?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()))
      : displayNodes;

  async function navigate() {
    if (!fromId || !toId) return;
    setLoading(true);
    setError("");
    setRoute(null);
    setActiveStep(0);
    try {
      if (!navigator.onLine && offlinePackage) {
        const offlineRoute = routeOffline(offlinePackage, fromId, toId, { accessibilityMode: accessible });
        if (!offlineRoute) {
          setError(accessible ? "No accessible offline route found in the downloaded package." : "No offline route found in the downloaded package.");
          setScreen("home");
          return;
        }
        setRoute(offlineRoute);
        setOfflineNotice("Route calculated from the downloaded package. Offline data may be stale.");
        setScreen("route");
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

  function applyManualCode() {
    const nextCode = manualCode.trim();
    if (!navigator.onLine && offlinePackage && nextCode) {
      const checkpointNode = resolveOfflineCheckpoint(offlinePackage, nextCode);
      if (checkpointNode) {
        setFromId(checkpointNode.id);
        setOfflineNotice(`Offline checkpoint ready: ${checkpointNode.name}.`);
        return;
      }
      setOfflineNotice("This checkpoint is not in the downloaded package. Choose your starting point manually.");
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (nextCode) params.set("node", nextCode);
    else params.delete("node");
    router.replace(`/navigate/${buildingId}?${params.toString()}`);
  }

  function clearQrCode() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("node");
    router.replace(params.size ? `/navigate/${buildingId}?${params.toString()}` : `/navigate/${buildingId}`);
    setManualCode("");
  }

  function reset() {
    setRoute(null);
    setError("");
    setToId("");
    setActiveStep(0);
    setScreen("home");
  }

  if (screen === "route" && route) {
    if (route.steps.length === 0) {
      return <div className="p-5"><div className="rounded-3xl border border-slate-200 bg-white p-6"><p className="mb-2 text-xl font-bold text-[#141414]">You&apos;re already there</p><p className="mb-4 text-sm text-slate-500">{route.warnings?.[0]?.message ?? "Start and destination are the same."}</p><button onClick={reset} className="inline-flex items-center gap-2 text-sm font-semibold text-[#141414]"><RotateCcw className="h-4 w-4" /> Choose another route</button></div></div>;
    }

    const currentStep = route.steps[activeStep];
    const isLast = activeStep === route.steps.length - 1;
    return (
      <div className="flex min-h-[calc(100vh-120px)] flex-col">
        {route.warnings?.length ? <div className="space-y-2 p-5 pb-0">{route.warnings.map((warning) => <div key={warning.code} className={cn("rounded-2xl border px-4 py-3 text-sm", warning.code === "ACCESSIBLE_ROUTE" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{warning.message}</div>)}</div> : null}
        <div className="h-1 bg-slate-200"><div className="h-full bg-[#3B82F6] transition-all duration-500" style={{ width: `${((activeStep + 1) / route.steps.length) * 100}%` }} /></div>
        <div className="flex items-center gap-6 bg-[#1e293b] px-5 py-4 text-white"><div className="flex items-center gap-2 text-sm"><Ruler className="h-3.5 w-3.5 opacity-50" /><span className="font-bold">{formatDistance(route.totalDistanceEstimate)}</span></div><div className="flex items-center gap-2 text-sm"><Clock className="h-3.5 w-3.5 opacity-50" /><span className="font-bold">{formatWalkTime(route.totalWalkTimeEstimate)}</span></div><span className="ml-auto font-mono text-xs opacity-40">{activeStep + 1}/{route.steps.length}</span></div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex flex-1 flex-col justify-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-slate-400">Step {activeStep + 1}</p><p className="mb-4 text-2xl font-bold leading-tight text-[#141414]">{currentStep.instruction}</p><div className="flex items-center gap-2 text-sm text-slate-500"><span>{currentStep.fromNode.name}</span><ArrowRight className="h-4 w-4" /><span className="font-semibold text-[#141414]">{currentStep.toNode.name}</span></div>{(currentStep.edge.requiresStairs || currentStep.edge.requiresElevator || currentStep.edge.requiresRamp || currentStep.floorChange) ? <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">{currentStep.edge.requiresElevator ? "🛗 Elevator" : currentStep.edge.requiresStairs ? "🪜 Stairs" : currentStep.edge.requiresRamp ? "♿ Ramp" : "⇅ Floor change"}</div> : null}</div>
          <div className="flex gap-3"><button onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0} className="flex-1 rounded-2xl border border-slate-200 py-4 font-semibold text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30">← Previous</button>{isLast ? <button onClick={reset} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#10b981] py-4 font-bold text-white"><CheckCircle2 className="h-5 w-5" /> Arrived!</button> : <button onClick={() => setActiveStep((s) => s + 1)} className="flex-1 rounded-2xl bg-[#141414] py-4 font-bold text-white transition-colors hover:bg-[#2d2d2d]">Next →</button>}</div>
          <div className="space-y-1">{route.steps.map((s, i) => <button key={i} onClick={() => setActiveStep(i)} className={cn("flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all", i === activeStep ? "bg-[#141414] text-white" : i < activeStep ? "bg-slate-50 text-slate-400 line-through" : "border border-slate-200 bg-white text-slate-700")}><span className="w-5 shrink-0 font-mono text-xs">{String(i + 1).padStart(2, "0")}</span><span className="truncate font-medium">{s.instruction}</span>{i === activeStep ? <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-50" /> : null}</button>)}</div>
          <button onClick={reset} className="flex items-center justify-center gap-2 py-2 text-sm text-slate-400"><RotateCcw className="h-3.5 w-3.5" /> Start over</button>
        </div>
      </div>
    );
  }

  if (screen === "search") {
    return (
      <div className="p-5">
        <div className="relative mb-4"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${searchTarget === "from" ? "starting point" : "destination"}…`} className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-11 pr-4 text-sm focus:border-[#141414] focus:outline-none" /></div>
        <button onClick={() => setScreen("home")} className="mb-4 block text-sm text-slate-400">← Back</button>
        <div className="space-y-1">{filteredNodes.slice(0, 20).map((node) => <button key={node.id} onClick={() => pickNode(node.id)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition-all hover:border-[#141414]"><span className="text-xl">{NODE_TYPE_ICONS[node.type] ?? "📍"}</span><div><p className="text-sm font-semibold text-[#141414]">{node.name}</p>{node.floor ? <p className="text-xs text-slate-400">{node.floor.name}</p> : null}</div></button>)}{filteredNodes.length === 0 ? <p className="py-8 text-center text-slate-400">No locations found</p> : null}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5">
      {offlineNotice ? <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{offlineNotice}</div> : null}
      {qrResolution.message ? <div className={cn("rounded-2xl border px-4 py-3 text-sm", qrResolution.status === "resolved" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : qrResolution.status === "inactive" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-700")}><div className="flex items-start gap-3"><QrCode className="mt-0.5 h-4 w-4 shrink-0" /><div className="space-y-1"><p className="font-semibold">{qrResolution.message}</p>{qrResolution.requestedCode ? <p className="font-mono text-xs opacity-80">Checkpoint code: {qrResolution.requestedCode}</p> : null}</div></div></div> : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2"><QrCode className="h-4 w-4 text-slate-500" /><p className="text-sm font-semibold text-[#141414]">Scan link or enter checkpoint code</p></div>
        <div className="flex gap-2"><input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Paste checkpoint code" className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#141414] focus:outline-none" /><button onClick={applyManualCode} className="rounded-2xl bg-[#141414] px-4 py-3 text-sm font-semibold text-white">Use code</button></div>
        {searchParams.get("node") ? <button onClick={clearQrCode} className="mt-3 text-sm text-slate-500 underline underline-offset-2">Clear checkpoint and choose manually</button> : null}
      </div>

      {currentNodeId && fromNode ? <div className="flex items-center gap-3 rounded-2xl bg-[#3B82F6] px-4 py-3 text-white"><MapPin className="h-5 w-5 shrink-0" /><div><p className="text-xs font-mono opacity-70">You are here</p><p className="font-bold">{fromNode.name}</p></div></div> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <button onClick={() => { setSearchTarget("from"); setScreen("search"); }} className="flex w-full items-center gap-3 border-b border-slate-100 px-5 py-4 transition-colors hover:bg-slate-50"><div className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-slate-400" /><span className={cn("flex-1 text-left text-sm", fromId ? "font-semibold text-[#141414]" : "text-slate-400")}>{fromNode ? fromNode.name : "Set starting point"}</span><ChevronRight className="h-4 w-4 text-slate-300" /></button>
        <button onClick={() => { setSearchTarget("to"); setScreen("search"); }} className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#3B82F6]" /><span className={cn("flex-1 text-left text-sm", toId ? "font-semibold text-[#141414]" : "text-slate-400")}>{toNode ? toNode.name : "Where do you want to go?"}</span><ChevronRight className="h-4 w-4 text-slate-300" /></button>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4"><Accessibility className="h-4 w-4 shrink-0 text-blue-500" /><span className="flex-1 text-sm font-medium">Accessible route (avoid stairs)</span><div onClick={() => setAccessible((a) => !a)} className={cn("relative h-6 w-11 rounded-full transition-colors", accessible ? "bg-[#3B82F6]" : "bg-slate-200")}><div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform", accessible ? "translate-x-6" : "translate-x-1")} /></div></label>

      <button onClick={navigate} disabled={!fromId || !toId || loading} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#141414] py-5 text-base font-bold text-white disabled:opacity-40">{loading ? <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : <Navigation className="h-5 w-5" />}Get Directions</button>

      {!toId ? <div><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Popular destinations</p><div className="grid grid-cols-2 gap-2">{displayNodes.filter((n) => ["ENTRANCE", "EXIT", "RESTROOM", "ELEVATOR", "RECEPTION"].includes(n.type)).slice(0, 6).map((n) => <button key={n.id} onClick={() => setToId(n.id)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-[#141414]"><span className="mb-1 block text-lg">{NODE_TYPE_ICONS[n.type]}</span><p className="truncate text-sm font-semibold text-[#141414]">{n.name}</p>{n.floor ? <p className="text-xs text-slate-400">{n.floor.name}</p> : null}</button>)}</div></div> : null}
    </div>
  );
}
