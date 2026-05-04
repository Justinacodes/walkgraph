"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, NodeTypeBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Trash2, Plus, Link2, MousePointer2, Layers, X } from "lucide-react";
import { NODE_TYPES } from "@/lib/validations/node";

type Mode = "select" | "addNode" | "addEdge";

interface Floor { id: string; name: string; levelNumber: number; }
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
  const [pendingXY, setPendingXY] = useState({ x: 100, y: 100 });
  const [addNodeForm, setAddNodeForm] = useState({ name: "", type: "ROOM" as string });
  const [addEdgeForm, setAddEdgeForm] = useState({
    fromNodeId: "", toNodeId: "", directionHint: "", accessible: true,
    requiresStairs: false, requiresElevator: false, oneWay: false,
    distanceEstimate: "", walkTimeEstimate: "",
  });
  const [saving, setSaving] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragNodeId = useRef<string | null>(null);
  const svgOffset = useRef({ x: 0, y: 0 });

  const floorNodes = nodes.filter((n) => n.floorId === selectedFloorId);
  const floorEdges = edges.filter((e) => {
    const from = nodes.find((n) => n.id === e.fromNodeId);
    const to = nodes.find((n) => n.id === e.toNodeId);
    return from?.floorId === selectedFloorId || to?.floorId === selectedFloorId;
  });
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  function getSVGCoords(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleSVGClick(e: React.MouseEvent<SVGSVGElement>) {
    if (e.target !== svgRef.current) return;
    if (mode === "addNode") {
      const coords = getSVGCoords(e);
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
        setAddEdgeForm({ ...addEdgeForm, fromNodeId: edgeFromId, toNodeId: nodeId });
        setShowAddEdge(true);
        setEdgeFromId(null);
      }
    } else {
      setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId);
    }
  }

  function handleMouseDown(e: React.MouseEvent, nodeId: string) {
    if (mode !== "select") return;
    e.stopPropagation();
    dragNodeId.current = nodeId;
    const rect = svgRef.current!.getBoundingClientRect();
    svgOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!dragNodeId.current) return;
    const coords = getSVGCoords(e);
    setNodes((prev) => prev.map((n) => n.id === dragNodeId.current ? { ...n, x: coords.x, y: coords.y } : n));
  }

  async function handleMouseUp() {
    if (!dragNodeId.current) return;
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

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Canvas */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2 bg-white rounded-2xl p-2 border border-slate-200 w-fit">
          {[
            { m: "select" as Mode, icon: <MousePointer2 className="w-4 h-4" />, label: "Select" },
            { m: "addNode" as Mode, icon: <Plus className="w-4 h-4" />, label: "Add Node" },
            { m: "addEdge" as Mode, icon: <Link2 className="w-4 h-4" />, label: "Add Edge" },
          ].map(({ m, icon, label }) => (
            <button
              key={m}
              onClick={() => { setMode(m); setEdgeFromId(null); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                mode === m ? "bg-[#141414] text-white" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {icon} {label}
            </button>
          ))}

          {/* Floor selector */}
          <div className="w-px h-6 bg-slate-200 mx-1" />
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
            className={cn("w-full h-full", mode === "addNode" && "cursor-crosshair", mode === "addEdge" && "cursor-pointer")}
            onClick={handleSVGClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Edges */}
            {floorEdges.map((edge) => {
              const from = nodes.find((n) => n.id === edge.fromNodeId);
              const to = nodes.find((n) => n.id === edge.toNodeId);
              if (!from || !to) return null;
              return (
                <g key={edge.id}>
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={edge.requiresStairs ? "#3b82f6" : edge.accessible ? "#94a3b8" : "#fca5a5"}
                    strokeWidth={2}
                    strokeDasharray={edge.requiresStairs || edge.requiresElevator ? "6,3" : undefined}
                  />
                  <circle
                    cx={(from.x + to.x) / 2} cy={(from.y + to.y) / 2} r={6}
                    fill="white" stroke="#e2e8f0" strokeWidth={1.5}
                    className="cursor-pointer hover:fill-red-50 hover:stroke-red-300"
                    onClick={(e) => { e.stopPropagation(); deleteEdge(edge.id); }}
                  />
                  <text
                    x={(from.x + to.x) / 2} y={(from.y + to.y) / 2}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={8} fill="#94a3b8" className="pointer-events-none select-none"
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
                <g key={node.id} transform={`translate(${node.x},${node.y})`}
                  onClick={(e) => handleNodeClick(e, node.id)}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  className="cursor-pointer"
                >
                  <circle
                    r={isSelected ? 18 : 14}
                    fill={isEdgeFrom ? "#dbeafe" : "white"}
                    stroke={isSelected ? "#141414" : isEdgeFrom ? "#3b82f6" : color}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all"
                  />
                  <circle r={7} fill={color} />
                  <text
                    y={26} textAnchor="middle" fontSize={9} fill="#374151"
                    fontWeight="600" className="pointer-events-none select-none"
                    style={{ maxWidth: 80 }}
                  >
                    {node.name.length > 12 ? node.name.slice(0, 12) + "…" : node.name}
                  </text>
                </g>
              );
            })}
          </svg>
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
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Searchable</span>
                <span className="font-mono font-bold">{selectedNode.searchable ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Restricted</span>
                <span className="font-mono font-bold">{selectedNode.restricted ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Position</span>
                <span className="font-mono font-bold">{Math.round(selectedNode.x)}, {Math.round(selectedNode.y)}</span>
              </div>
            </div>

            {/* Connected edges */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Connections</p>
              {edges.filter((e) => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id).length === 0 ? (
                <p className="text-xs text-slate-400">No connections yet</p>
              ) : (
                <div className="space-y-1">
                  {edges
                    .filter((e) => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id)
                    .map((e) => {
                      const other = nodes.find((n) => n.id === (e.fromNodeId === selectedNode.id ? e.toNodeId : e.fromNodeId));
                      return (
                        <div key={e.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2 py-1.5">
                          <span className="font-medium truncate">{other?.name ?? "Unknown"}</span>
                          <button onClick={() => deleteEdge(e.id)} className="text-slate-300 hover:text-red-500 ml-2">
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
              {Object.entries({
                "Entrance / Exit": "#10b981",
                "Room / Office": "#6b7280",
                "Staircase / Elevator": "#3b82f6",
                "Landmark / Reception": "#f59e0b",
                "Hallway / Corridor": "#94a3b8",
              }).map(([label, color]) => (
                <div key={label} className="flex items-center gap-2 text-xs mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-600">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 text-xs text-slate-400">
              <p>• <strong>Select mode:</strong> Click nodes to inspect, drag to move</p>
              <p>• <strong>Add Node:</strong> Click on the canvas to place</p>
              <p>• <strong>Add Edge:</strong> Click two nodes to connect</p>
            </div>
          </div>
        )}
      </div>

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
          <Input label="Direction hint (optional)" value={addEdgeForm.directionHint} onChange={(e) => setAddEdgeForm({ ...addEdgeForm, directionHint: e.target.value })} placeholder="Turn left into the BA corridor" />
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
                <input
                  type="checkbox"
                  checked={addEdgeForm[key as keyof typeof addEdgeForm] as boolean}
                  onChange={(e) => setAddEdgeForm({ ...addEdgeForm, [key]: e.target.checked })}
                  className="rounded"
                />
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
    </div>
  );
}
