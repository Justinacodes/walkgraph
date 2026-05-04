"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { NodeTypeBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Trash2, Plus, Link2, MousePointer2, Layers, X,
  ImagePlus, ZoomIn, ZoomOut, Maximize2, GitBranch, Upload,
} from "lucide-react";
import { NODE_TYPES } from "@/lib/validations/node";

type Mode = "select" | "addNode" | "addEdge";

interface Floor { id: string; name: string; levelNumber: number; floorPlanImageUrl?: string | null; }
interface Node {
  id: string; name: string; type: string; x: number; y: number; floorId: string;
  description?: string | null; restricted: boolean; searchable: boolean;
  floor?: { name: string; levelNumber: number };
}
interface Edge {
  id: string; fromNodeId: string; toNodeId: string;
  distanceEstimate?: number | null; walkTimeEstimate?: number | null;
  directionHint?: string | null; accessible: boolean;
  requiresStairs: boolean; requiresElevator: boolean; restricted: boolean; oneWay: boolean;
  fromNode?: { id: string; name: string }; toNode?: { id: string; name: string };
}
interface ViewBox { x: number; y: number; w: number; h: number; }

const CANVAS_W = 2000;
const CANVAS_H = 1500;
const INITIAL_VB: ViewBox = { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H };

const NODE_COLORS: Record<string, string> = {
  ENTRANCE: "#10b981", EXIT: "#ef4444", EMERGENCY_EXIT: "#ef4444",
  RESTRICTED_AREA: "#ef4444", ELEVATOR: "#3b82f6", STAIRCASE: "#3b82f6",
  RAMP: "#3b82f6", ROOM: "#6b7280", OFFICE: "#6b7280", LECTURE_HALL: "#8b5cf6",
  RESTROOM: "#64748b", RECEPTION: "#f59e0b", LANDMARK: "#f59e0b",
  HALLWAY_POINT: "#94a3b8", CORRIDOR_JUNCTION: "#94a3b8", DOOR: "#94a3b8",
};

const NODE_TYPE_OPTIONS = NODE_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }));

export function GraphEditor({
  buildingId,
  floors,
  initialNodes,
  initialEdges,
}: {
  buildingId: string;
  floors: Floor[];
  initialNodes: Node[];
  initialEdges: Edge[];
}) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [mode, setMode] = useState<Mode>("select");
  const [selectedFloorId, setSelectedFloorId] = useState<string>(floors[0]?.id ?? "");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [edgeFromId, setEdgeFromId] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [showCrossFloorEdge, setShowCrossFloorEdge] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [pendingXY, setPendingXY] = useState({ x: 400, y: 300 });
  const [addNodeForm, setAddNodeForm] = useState({ name: "", type: "ROOM" as string });
  const [addEdgeForm, setAddEdgeForm] = useState({
    fromNodeId: "", toNodeId: "", directionHint: "", accessible: true,
    requiresStairs: false, requiresElevator: false, oneWay: false,
    distanceEstimate: "", walkTimeEstimate: "",
  });
  const [crossFloorForm, setCrossFloorForm] = useState({
    fromNodeId: "", toNodeId: "", requiresStairs: false, requiresElevator: false,
    directionHint: "", distanceEstimate: "", walkTimeEstimate: "",
  });
  const [floorPlanUrl, setFloorPlanUrl] = useState("");
  const [floorPlanImages, setFloorPlanImages] = useState<Record<string, string>>(
    Object.fromEntries(floors.filter((f) => f.floorPlanImageUrl).map((f) => [f.id, f.floorPlanImageUrl!]))
  );
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<{ name: string; type: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [vb, setVb] = useState<ViewBox>(INITIAL_VB);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragNodeId = useRef<string | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, vbx: 0, vby: 0 });

  const floorNodes = nodes.filter((n) => n.floorId === selectedFloorId);
  const floorEdges = edges.filter((e) => {
    const from = nodes.find((n) => n.id === e.fromNodeId);
    const to = nodes.find((n) => n.id === e.toNodeId);
    return from?.floorId === selectedFloorId || to?.floorId === selectedFloorId;
  });
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  function toSVGCoords(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width * vb.w + vb.x,
      y: (clientY - rect.top) / rect.height * vb.h + vb.y,
    };
  }

  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.12 : 0.89;
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * vb.w + vb.x;
    const my = (e.clientY - rect.top) / rect.height * vb.h + vb.y;
    const newW = Math.min(Math.max(vb.w * factor, 200), CANVAS_W * 3);
    const newH = Math.min(Math.max(vb.h * factor, 150), CANVAS_H * 3);
    setVb({
      x: mx - (mx - vb.x) * (newW / vb.w),
      y: my - (my - vb.y) * (newH / vb.h),
      w: newW, h: newH,
    });
  }

  function zoom(factor: number) {
    const cx = vb.x + vb.w / 2;
    const cy = vb.y + vb.h / 2;
    const newW = Math.min(Math.max(vb.w * factor, 200), CANVAS_W * 3);
    const newH = Math.min(Math.max(vb.h * factor, 150), CANVAS_H * 3);
    setVb({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH });
  }

  function handleSVGMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (e.target !== svgRef.current && !(e.target as Element).classList.contains("pan-bg")) return;
    if (mode === "select") {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, vbx: vb.x, vby: vb.y };
    }
  }

  function handleSVGClick(e: React.MouseEvent<SVGSVGElement>) {
    if (e.target !== svgRef.current && !(e.target as Element).classList.contains("pan-bg")) return;
    if (mode === "addNode") {
      const coords = toSVGCoords(e.clientX, e.clientY);
      setPendingXY(coords);
      setAddNodeForm({ name: "", type: "ROOM" });
      setShowAddNode(true);
    } else {
      setSelectedNodeId(null);
    }
  }

  function handleNodeClick(e: React.MouseEvent, nodeId: string) {
    e.stopPropagation();
    if (mode === "addEdge") {
      if (!edgeFromId) {
        setEdgeFromId(nodeId);
      } else if (edgeFromId !== nodeId) {
        setAddEdgeForm((f) => ({ ...f, fromNodeId: edgeFromId, toNodeId: nodeId }));
        setShowAddEdge(true);
        setEdgeFromId(null);
      }
    } else {
      setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId);
    }
  }

  function handleNodeMouseDown(e: React.MouseEvent, nodeId: string) {
    if (mode !== "select") return;
    e.stopPropagation();
    dragNodeId.current = nodeId;
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (dragNodeId.current) {
      const coords = toSVGCoords(e.clientX, e.clientY);
      setNodes((prev) => prev.map((n) => n.id === dragNodeId.current ? { ...n, x: coords.x, y: coords.y } : n));
    } else if (isPanning.current) {
      const rect = svgRef.current!.getBoundingClientRect();
      const dx = (e.clientX - panStart.current.x) / rect.width * vb.w;
      const dy = (e.clientY - panStart.current.y) / rect.height * vb.h;
      setVb((prev) => ({ ...prev, x: panStart.current.vbx - dx, y: panStart.current.vby - dy }));
    }
  }

  async function handleMouseUp() {
    if (dragNodeId.current) {
      const node = nodes.find((n) => n.id === dragNodeId.current);
      if (node) {
        await fetch(`/api/nodes/${dragNodeId.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ x: node.x, y: node.y }),
        });
      }
      dragNodeId.current = null;
    }
    isPanning.current = false;
  }

  async function saveFloorPlan() {
    setSaving(true);
    const res = await fetch(`/api/floors/${selectedFloorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ floorPlanImageUrl: floorPlanUrl || null }),
    });
    if (res.ok) {
      setFloorPlanImages((prev) => {
        const next = { ...prev };
        if (floorPlanUrl) next[selectedFloorId] = floorPlanUrl;
        else delete next[selectedFloorId];
        return next;
      });
      setShowFloorPlan(false);
    }
    setSaving(false);
  }

  async function addNode() {
    if (!addNodeForm.name || !selectedFloorId) return;
    setSaving(true);
    const res = await fetch("/api/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buildingId, floorId: selectedFloorId,
        name: addNodeForm.name, type: addNodeForm.type,
        x: pendingXY.x, y: pendingXY.y,
      }),
    });
    if (res.ok) {
      const node = await res.json();
      setNodes((prev) => [...prev, { ...node, floor: floors.find((f) => f.id === selectedFloorId) }]);
      setShowAddNode(false);
    }
    setSaving(false);
  }

  async function addEdge() {
    setSaving(true);
    const res = await fetch("/api/edges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buildingId,
        fromNodeId: addEdgeForm.fromNodeId,
        toNodeId: addEdgeForm.toNodeId,
        directionHint: addEdgeForm.directionHint || null,
        accessible: addEdgeForm.accessible,
        requiresStairs: addEdgeForm.requiresStairs,
        requiresElevator: addEdgeForm.requiresElevator,
        oneWay: addEdgeForm.oneWay,
        distanceEstimate: addEdgeForm.distanceEstimate ? parseFloat(addEdgeForm.distanceEstimate) : null,
        walkTimeEstimate: addEdgeForm.walkTimeEstimate ? parseFloat(addEdgeForm.walkTimeEstimate) : null,
      }),
    });
    if (res.ok) {
      const edge = await res.json();
      setEdges((prev) => [...prev, {
        ...edge,
        fromNode: nodes.find((n) => n.id === edge.fromNodeId),
        toNode: nodes.find((n) => n.id === edge.toNodeId),
      }]);
      setShowAddEdge(false);
    }
    setSaving(false);
  }

  async function addCrossFloorEdge() {
    if (!crossFloorForm.fromNodeId || !crossFloorForm.toNodeId) return;
    setSaving(true);
    const res = await fetch("/api/edges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buildingId,
        fromNodeId: crossFloorForm.fromNodeId,
        toNodeId: crossFloorForm.toNodeId,
        requiresStairs: crossFloorForm.requiresStairs,
        requiresElevator: crossFloorForm.requiresElevator,
        directionHint: crossFloorForm.directionHint || null,
        distanceEstimate: crossFloorForm.distanceEstimate ? parseFloat(crossFloorForm.distanceEstimate) : null,
        walkTimeEstimate: crossFloorForm.walkTimeEstimate ? parseFloat(crossFloorForm.walkTimeEstimate) : null,
        accessible: !crossFloorForm.requiresStairs,
        oneWay: false,
      }),
    });
    if (res.ok) {
      const edge = await res.json();
      setEdges((prev) => [...prev, {
        ...edge,
        fromNode: nodes.find((n) => n.id === edge.fromNodeId),
        toNode: nodes.find((n) => n.id === edge.toNodeId),
      }]);
      setShowCrossFloorEdge(false);
      setCrossFloorForm({ fromNodeId: "", toNodeId: "", requiresStairs: false, requiresElevator: false, directionHint: "", distanceEstimate: "", walkTimeEstimate: "" });
    }
    setSaving(false);
  }

  async function deleteNode(nodeId: string) {
    await fetch(`/api/nodes/${nodeId}`, { method: "DELETE" });
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId));
    setSelectedNodeId(null);
  }

  async function deleteEdge(edgeId: string) {
    await fetch(`/api/edges/${edgeId}`, { method: "DELETE" });
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  }

  function parseCsv(text: string) {
    const lines = text.trim().split("\n").slice(1); // skip header
    const parsed = lines.map((line) => {
      const [name, type] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
      return { name: name ?? "", type: (type ?? "ROOM").toUpperCase() };
    }).filter((r) => r.name);
    setCsvPreview(parsed);
  }

  async function importCsv() {
    if (!csvPreview.length) return;
    setSaving(true);
    let col = 0, row = 0;
    for (const { name, type } of csvPreview) {
      const x = 100 + (col % 8) * 220;
      const y = 100 + row * 180;
      const validType = NODE_TYPES.includes(type as typeof NODE_TYPES[number]) ? type : "ROOM";
      const res = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildingId, floorId: selectedFloorId, name, type: validType, x, y }),
      });
      if (res.ok) {
        const node = await res.json();
        setNodes((prev) => [...prev, { ...node, floor: floors.find((f) => f.id === selectedFloorId) }]);
      }
      col++;
      if (col % 8 === 0) row++;
    }
    setSaving(false);
    setShowCsvImport(false);
    setCsvText("");
    setCsvPreview([]);
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Canvas */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl p-2 border border-slate-200">
          {([
            { m: "select" as Mode, icon: <MousePointer2 className="w-4 h-4" />, label: "Select" },
            { m: "addNode" as Mode, icon: <Plus className="w-4 h-4" />, label: "Add Node" },
            { m: "addEdge" as Mode, icon: <Link2 className="w-4 h-4" />, label: "Add Edge" },
          ] as const).map(({ m, icon, label }) => (
            <button
              key={m}
              onClick={() => { setMode(m); setEdgeFromId(null); }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                mode === m ? "bg-[#141414] text-white" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {icon} {label}
            </button>
          ))}

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Cross-floor edge */}
          <button
            onClick={() => setShowCrossFloorEdge(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
            title="Connect nodes on different floors"
          >
            <GitBranch className="w-4 h-4" /> Cross-Floor Edge
          </button>

          {/* CSV import */}
          <button
            onClick={() => setShowCsvImport(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>

          {/* Floor plan */}
          <button
            onClick={() => { setFloorPlanUrl(floorPlanImages[selectedFloorId] ?? ""); setShowFloorPlan(true); }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
              floorPlanImages[selectedFloorId] ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <ImagePlus className="w-4 h-4" />
            {floorPlanImages[selectedFloorId] ? "Floor Plan ✓" : "Floor Plan"}
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Floor selector */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              className="text-sm font-semibold bg-transparent border-none focus:outline-none pr-4"
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Zoom controls */}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => zoom(0.75)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => zoom(1.33)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => setVb(INITIAL_VB)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Reset view"><Maximize2 className="w-4 h-4" /></button>
          </div>
        </div>

        {mode === "addEdge" && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-xl">
            {edgeFromId
              ? `From: "${nodes.find((n) => n.id === edgeFromId)?.name}" — now click the destination node`
              : "Click the starting node to begin drawing an edge"}
          </div>
        )}

        {/* SVG Canvas */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden relative">
          {floors.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              Add floors first to start placing nodes
            </div>
          )}
          <svg
            ref={svgRef}
            className={cn(
              "w-full h-full",
              mode === "addNode" && "cursor-crosshair",
              mode === "addEdge" && "cursor-pointer",
              mode === "select" && "cursor-default",
            )}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            onClick={handleSVGClick}
            onMouseDown={handleSVGMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              </pattern>
            </defs>
            {/* Background — needs pan-bg class so click/mousedown targets are detected */}
            <rect className="pan-bg" x={vb.x - 5000} y={vb.y - 5000} width={vb.w + 10000} height={vb.h + 10000} fill="url(#grid)" />

            {/* Floor plan image */}
            {floorPlanImages[selectedFloorId] && (
              <image
                href={floorPlanImages[selectedFloorId]}
                x={0} y={0} width={CANVAS_W} height={CANVAS_H}
                preserveAspectRatio="xMidYMid meet"
                style={{ opacity: 0.35 }}
              />
            )}

            {/* Edges */}
            {floorEdges.map((edge) => {
              const from = nodes.find((n) => n.id === edge.fromNodeId);
              const to = nodes.find((n) => n.id === edge.toNodeId);
              if (!from || !to) return null;
              const isCrossFloor = from.floorId !== to.floorId;
              return (
                <g key={edge.id}>
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={
                      isCrossFloor ? "#a855f7"
                        : edge.requiresStairs ? "#3b82f6"
                        : edge.accessible ? "#94a3b8" : "#fca5a5"
                    }
                    strokeWidth={isCrossFloor ? 3 : 2}
                    strokeDasharray={
                      isCrossFloor ? "8,4"
                        : edge.requiresStairs || edge.requiresElevator ? "6,3"
                        : undefined
                    }
                  />
                  <circle
                    cx={(from.x + to.x) / 2} cy={(from.y + to.y) / 2} r={8}
                    fill="white" stroke="#e2e8f0" strokeWidth={1.5}
                    className="cursor-pointer hover:fill-red-50 hover:stroke-red-300"
                    onClick={(e) => { e.stopPropagation(); deleteEdge(edge.id); }}
                  />
                  <text
                    x={(from.x + to.x) / 2} y={(from.y + to.y) / 2}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={10} fill="#94a3b8" className="pointer-events-none select-none"
                  >×</text>
                </g>
              );
            })}

            {/* Nodes */}
            {floorNodes.map((node) => {
              const color = NODE_COLORS[node.type] ?? "#94a3b8";
              const isSelected = selectedNodeId === node.id;
              const isEdgeFrom = edgeFromId === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  onClick={(e) => handleNodeClick(e, node.id)}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  className="cursor-pointer"
                >
                  <circle
                    r={isSelected ? 20 : 15}
                    fill={isEdgeFrom ? "#dbeafe" : "white"}
                    stroke={isSelected ? "#141414" : isEdgeFrom ? "#3b82f6" : color}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all"
                  />
                  <circle r={8} fill={color} />
                  <text
                    y={30} textAnchor="middle" fontSize={11} fill="#374151"
                    fontWeight="600" className="pointer-events-none select-none"
                  >
                    {node.name.length > 14 ? node.name.slice(0, 14) + "…" : node.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Zoom level badge */}
          <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur text-xs font-mono text-slate-400 px-2 py-1 rounded-lg border border-slate-200">
            {Math.round((CANVAS_W / vb.w) * 100)}%
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="w-72 shrink-0">
        {selectedNode ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 h-full overflow-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-lg">{selectedNode.name}</h3>
              <button onClick={() => setSelectedNodeId(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <NodeTypeBadge type={selectedNode.type} />
            {selectedNode.floor && (
              <p className="font-mono text-xs text-slate-400 mt-2">
                Floor {selectedNode.floor.levelNumber} — {selectedNode.floor.name}
              </p>
            )}
            {selectedNode.description && (
              <p className="text-sm text-slate-600 mt-3">{selectedNode.description}</p>
            )}
            <div className="mt-4 space-y-2">
              {[
                ["Searchable", selectedNode.searchable ? "Yes" : "No"],
                ["Restricted", selectedNode.restricted ? "Yes" : "No"],
                ["Position", `${Math.round(selectedNode.x)}, ${Math.round(selectedNode.y)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-mono font-bold">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Connections</p>
              {edges.filter((e) => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id).length === 0 ? (
                <p className="text-xs text-slate-400">No connections yet</p>
              ) : (
                <div className="space-y-1">
                  {edges
                    .filter((e) => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id)
                    .map((e) => {
                      const otherId = e.fromNodeId === selectedNode.id ? e.toNodeId : e.fromNodeId;
                      const other = nodes.find((n) => n.id === otherId);
                      const otherFloor = floors.find((f) => f.id === other?.floorId);
                      const isCross = other?.floorId !== selectedNode.floorId;
                      return (
                        <div key={e.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2 py-1.5">
                          <div>
                            <span className="font-medium truncate">{other?.name ?? "Unknown"}</span>
                            {isCross && <span className="ml-1 text-purple-500 font-mono">↕ {otherFloor?.name}</span>}
                          </div>
                          <button onClick={() => deleteEdge(e.id)} className="text-slate-300 hover:text-red-500 ml-2 shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="mt-6 flex items-center gap-2 text-red-500 text-xs font-semibold hover:text-red-700 w-full py-2"
            >
              <Trash2 className="w-3 h-3" /> Delete node
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 h-full">
            <p className="text-sm font-semibold text-slate-700 mb-2">Graph Summary</p>
            <div className="space-y-2 font-mono text-xs text-slate-500">
              <div className="flex justify-between"><span>Total nodes</span><span className="font-bold text-[#141414]">{nodes.length}</span></div>
              <div className="flex justify-between"><span>Total edges</span><span className="font-bold text-[#141414]">{edges.length}</span></div>
              <div className="flex justify-between"><span>This floor</span><span className="font-bold text-[#141414]">{floorNodes.length} nodes</span></div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Legend</p>
              {[
                ["Entrance / Exit", "#10b981"],
                ["Room / Office", "#6b7280"],
                ["Staircase / Elevator", "#3b82f6"],
                ["Landmark / Reception", "#f59e0b"],
                ["Hallway / Corridor", "#94a3b8"],
                ["Cross-floor edge", "#a855f7"],
              ].map(([label, color]) => (
                <div key={label} className="flex items-center gap-2 text-xs mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-600">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-1.5 text-xs text-slate-400">
              <p>• <strong>Select:</strong> click to inspect, drag to move</p>
              <p>• <strong>Add Node:</strong> click canvas to place</p>
              <p>• <strong>Add Edge:</strong> click two nodes</p>
              <p>• <strong>Scroll</strong> to zoom, <strong>drag canvas</strong> to pan</p>
            </div>
          </div>
        )}
      </div>

      {/* Floor Plan Modal */}
      <Modal open={showFloorPlan} onClose={() => setShowFloorPlan(false)} title="Set Floor Plan Background">
        <div className="space-y-4">
          {/* File drop zone */}
          <label className="block border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-[#141414] transition-colors group">
            <ImagePlus className="w-8 h-8 mx-auto mb-2 text-slate-300 group-hover:text-slate-500" />
            <p className="text-sm font-semibold text-slate-500">Drop a floor plan image or click to upload</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG, SVG, WebP — max 10 MB</p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSaving(true);
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: fd });
                const data = await res.json();
                if (data.url) setFloorPlanUrl(data.url);
                setSaving(false);
              }}
            />
          </label>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" /> or paste URL <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Input
            label="Image URL"
            value={floorPlanUrl}
            onChange={(e) => setFloorPlanUrl(e.target.value)}
            placeholder="https://example.com/floor-plan.png"
          />
          {floorPlanUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 h-40 bg-slate-50 flex items-center justify-center">
              <img src={floorPlanUrl} alt="Preview" className="max-h-full max-w-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowFloorPlan(false)}>Cancel</Button>
            {floorPlanImages[selectedFloorId] && (
              <Button variant="secondary" onClick={() => { setFloorPlanUrl(""); saveFloorPlan(); }} loading={saving}>Remove</Button>
            )}
            <Button onClick={saveFloorPlan} loading={saving} disabled={!floorPlanUrl}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Add Node Modal */}
      <Modal open={showAddNode} onClose={() => setShowAddNode(false)} title="Add Node">
        <div className="space-y-4">
          <Input label="Node name" value={addNodeForm.name} onChange={(e) => setAddNodeForm({ ...addNodeForm, name: e.target.value })} placeholder="Reception Desk" autoFocus />
          <Select label="Node type" value={addNodeForm.type} onChange={(e) => setAddNodeForm({ ...addNodeForm, type: e.target.value })} options={NODE_TYPE_OPTIONS} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddNode(false)}>Cancel</Button>
            <Button onClick={addNode} loading={saving} disabled={!addNodeForm.name}>Add Node</Button>
          </div>
        </div>
      </Modal>

      {/* Add Edge Modal */}
      <Modal open={showAddEdge} onClose={() => setShowAddEdge(false)} title="Connect Nodes">
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="bg-white border border-slate-200 rounded-lg px-3 py-1.5">{nodes.find((n) => n.id === addEdgeForm.fromNodeId)?.name}</span>
              <span className="text-slate-400">→</span>
              <span className="bg-white border border-slate-200 rounded-lg px-3 py-1.5">{nodes.find((n) => n.id === addEdgeForm.toNodeId)?.name}</span>
            </div>
          </div>
          <Input label="Direction hint (optional)" value={addEdgeForm.directionHint} onChange={(e) => setAddEdgeForm({ ...addEdgeForm, directionHint: e.target.value })} placeholder="Turn left into the corridor" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Distance (m)" type="number" value={addEdgeForm.distanceEstimate} onChange={(e) => setAddEdgeForm({ ...addEdgeForm, distanceEstimate: e.target.value })} placeholder="10" />
            <Input label="Walk time (s)" type="number" value={addEdgeForm.walkTimeEstimate} onChange={(e) => setAddEdgeForm({ ...addEdgeForm, walkTimeEstimate: e.target.value })} placeholder="30" />
          </div>
          <div className="space-y-2">
            {[
              { key: "accessible", label: "Accessible route" },
              { key: "requiresStairs", label: "Requires stairs" },
              { key: "requiresElevator", label: "Requires elevator" },
              { key: "oneWay", label: "One-way only" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox"
                  checked={addEdgeForm[key as keyof typeof addEdgeForm] as boolean}
                  onChange={(e) => setAddEdgeForm({ ...addEdgeForm, [key]: e.target.checked })}
                  className="rounded" />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddEdge(false)}>Cancel</Button>
            <Button onClick={addEdge} loading={saving}>Create Connection</Button>
          </div>
        </div>
      </Modal>

      {/* Cross-Floor Edge Modal */}
      <Modal open={showCrossFloorEdge} onClose={() => setShowCrossFloorEdge(false)} title="Connect Nodes Across Floors">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Connect a staircase or elevator node on one floor to a node on a different floor. This allows Dijkstra to route visitors between floors.</p>
          <Select
            label="From node"
            value={crossFloorForm.fromNodeId}
            onChange={(e) => setCrossFloorForm((f) => ({ ...f, fromNodeId: e.target.value }))}
            options={nodes.map((n) => {
              const fl = floors.find((f) => f.id === n.floorId);
              return { value: n.id, label: `${n.name} (${fl?.name ?? "?"})` };
            })}
          />
          <Select
            label="To node (different floor)"
            value={crossFloorForm.toNodeId}
            onChange={(e) => setCrossFloorForm((f) => ({ ...f, toNodeId: e.target.value }))}
            options={nodes
              .filter((n) => {
                const fromNode = nodes.find((x) => x.id === crossFloorForm.fromNodeId);
                return !fromNode || n.floorId !== fromNode.floorId;
              })
              .map((n) => {
                const fl = floors.find((f) => f.id === n.floorId);
                return { value: n.id, label: `${n.name} (${fl?.name ?? "?"})` };
              })}
          />
          <div className="space-y-2">
            {[
              { key: "requiresStairs", label: "Via stairs" },
              { key: "requiresElevator", label: "Via elevator" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox"
                  checked={crossFloorForm[key as keyof typeof crossFloorForm] as boolean}
                  onChange={(e) => setCrossFloorForm((f) => ({ ...f, [key]: e.target.checked }))}
                  className="rounded" />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Distance (m)" type="number" value={crossFloorForm.distanceEstimate}
              onChange={(e) => setCrossFloorForm((f) => ({ ...f, distanceEstimate: e.target.value }))} placeholder="20" />
            <Input label="Walk time (s)" type="number" value={crossFloorForm.walkTimeEstimate}
              onChange={(e) => setCrossFloorForm((f) => ({ ...f, walkTimeEstimate: e.target.value }))} placeholder="60" />
          </div>
          <Input label="Direction hint (optional)" value={crossFloorForm.directionHint}
            onChange={(e) => setCrossFloorForm((f) => ({ ...f, directionHint: e.target.value }))}
            placeholder="Take the elevator to Floor 2" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCrossFloorEdge(false)}>Cancel</Button>
            <Button onClick={addCrossFloorEdge} loading={saving}
              disabled={!crossFloorForm.fromNodeId || !crossFloorForm.toNodeId}>
              Create Cross-Floor Edge
            </Button>
          </div>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal open={showCsvImport} onClose={() => { setShowCsvImport(false); setCsvText(""); setCsvPreview([]); }} title="Import Nodes from CSV">
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 font-mono text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">CSV format (header required):</p>
            <p>name,type</p>
            <p>Reception Desk,RECEPTION</p>
            <p>Room 101,ROOM</p>
            <p>Staircase A,STAIRCASE</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Paste CSV</label>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); parseCsv(e.target.value); }}
              className="w-full border border-slate-200 rounded-xl p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#141414]"
              placeholder={"name,type\nRoom 101,ROOM\nRoom 102,ROOM"}
            />
          </div>
          {csvPreview.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-800 mb-1">{csvPreview.length} nodes to import on current floor</p>
              <div className="max-h-28 overflow-auto space-y-0.5">
                {csvPreview.map((r, i) => (
                  <p key={i} className="text-xs text-blue-700 font-mono">{r.name} — {r.type}</p>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowCsvImport(false); setCsvText(""); setCsvPreview([]); }}>Cancel</Button>
            <Button onClick={importCsv} loading={saving} disabled={csvPreview.length === 0}>
              Import {csvPreview.length > 0 ? `${csvPreview.length} nodes` : ""}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
