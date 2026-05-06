import { dijkstra } from "@/lib/routing/dijkstra";
import type { GraphEdge, GraphFloor, GraphNode, RouteOptions, RouteResult } from "@/lib/routing/types";
import type { OfflineBuildingPackage } from "@/lib/offline-package";

const DB_NAME = "walkgraph-offline-v1";
const STORE_NAME = "buildingPackages";
const REGISTRY_KEY = "walkgraph.offline.registry.v1";
const SUPPORTED_SCHEMA_VERSION = 1;

export interface OfflinePackageRegistryEntry {
  buildingId: string;
  name: string;
  schemaVersion: number;
  packageVersion: number;
  downloadedAt: string;
  publishedAt: string | null;
  status: "current" | "stale" | "unsupported";
}

interface OfflineRegistry { packages: Record<string, OfflinePackageRegistryEntry>; }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "buildingId" });
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function readRegistry(): OfflineRegistry {
  if (typeof window === "undefined") return { packages: {} };
  try {
    const parsed = JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && "packages" in parsed ? parsed as OfflineRegistry : { packages: {} };
  } catch {
    return { packages: {} };
  }
}

function writeRegistry(registry: OfflineRegistry) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

export function getOfflineRegistryEntry(buildingId: string) {
  return readRegistry().packages[buildingId] ?? null;
}

export async function saveOfflinePackage(pkg: OfflineBuildingPackage) {
  validatePackage(pkg, pkg.buildingId);
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(pkg);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();

  const registry = readRegistry();
  registry.packages[pkg.buildingId] = {
    buildingId: pkg.buildingId,
    name: pkg.building.name,
    schemaVersion: pkg.schemaVersion,
    packageVersion: pkg.packageVersion,
    downloadedAt: new Date().toISOString(),
    publishedAt: pkg.publishedAt,
    status: pkg.schemaVersion === SUPPORTED_SCHEMA_VERSION ? "current" : "unsupported",
  };
  writeRegistry(registry);
}

export async function loadOfflinePackage(buildingId: string): Promise<OfflineBuildingPackage | null> {
  const db = await openDb();
  const pkg = await new Promise<OfflineBuildingPackage | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(buildingId);
    request.onsuccess = () => resolve((request.result as OfflineBuildingPackage | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return pkg;
}

export async function deleteOfflinePackage(buildingId: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(buildingId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  const registry = readRegistry();
  delete registry.packages[buildingId];
  writeRegistry(registry);
}

export async function downloadOfflinePackage(buildingId: string) {
  const res = await fetch(`/api/buildings/${buildingId}/download`, { cache: "no-store" });
  if (!res.ok) throw new Error("Offline package is unavailable for this building.");
  const pkg = await res.json() as OfflineBuildingPackage;
  validatePackage(pkg, buildingId);
  await saveOfflinePackage(pkg);
  return pkg;
}

export async function markOfflinePackageStatus(buildingId: string, latestPackageVersion: number) {
  const registry = readRegistry();
  const entry = registry.packages[buildingId];
  if (!entry) return null;
  entry.status = entry.schemaVersion !== SUPPORTED_SCHEMA_VERSION ? "unsupported" : entry.packageVersion < latestPackageVersion ? "stale" : "current";
  writeRegistry(registry);
  return entry;
}

export function searchOfflineNodes(pkg: OfflineBuildingPackage, query: string) {
  const normalized = query.trim().toLowerCase();
  const publicNodes = pkg.nodes.filter((node) => node.searchable && !node.restricted);
  if (!normalized) return publicNodes;
  const matches = new Set(pkg.searchIndex.filter((entry) => entry.terms.some((term) => term.includes(normalized))).map((entry) => entry.nodeId));
  return publicNodes.filter((node) => matches.has(node.id));
}

export function resolveOfflineCheckpoint(pkg: OfflineBuildingPackage, code: string) {
  const normalizedCode = code.trim().toLowerCase();
  const checkpoint = pkg.qrCheckpoints.find((item) => {
    if (!item.active) return false;
    const fullCode = item.code.toLowerCase();
    return fullCode === normalizedCode || (normalizedCode.length <= 8 && fullCode.endsWith(normalizedCode));
  });
  if (!checkpoint) return null;
  return pkg.nodes.find((node) => node.id === checkpoint.nodeId && node.searchable && !node.restricted) ?? null;
}

export function routeOffline(pkg: OfflineBuildingPackage, fromNodeId: string, toNodeId: string, options: RouteOptions = {}): RouteResult | null {
  const fromNode = pkg.nodes.find((node) => node.id === fromNodeId);
  const toNode = pkg.nodes.find((node) => node.id === toNodeId);
  if (!fromNode?.searchable || fromNode.restricted || !toNode?.searchable || toNode.restricted) return null;

  return dijkstra(
    pkg.nodes.map((node): GraphNode => ({ id: node.id, name: node.name, type: node.type, floorId: node.floorId, x: node.x, y: node.y, searchable: node.searchable, restricted: node.restricted })),
    pkg.edges.map((edge): GraphEdge => ({ ...edge })),
    pkg.floors.map((floor): GraphFloor => ({ id: floor.id, name: floor.name, levelNumber: floor.levelNumber })),
    fromNodeId,
    toNodeId,
    options
  );
}

function validatePackage(pkg: OfflineBuildingPackage, buildingId: string) {
  if (pkg.schemaVersion !== SUPPORTED_SCHEMA_VERSION) throw new Error("This offline package version is not supported. Re-download the building.");
  if (pkg.buildingId !== buildingId) throw new Error("Offline package does not match this building.");
  if (!Number.isInteger(pkg.packageVersion) || pkg.packageVersion < 1) throw new Error("Offline package has an invalid version.");
}
