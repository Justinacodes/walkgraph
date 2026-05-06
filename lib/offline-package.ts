import type { Prisma } from "@prisma/client";

export const OFFLINE_PACKAGE_SCHEMA_VERSION = 1;

export interface OfflineBuildingPackage {
  schemaVersion: 1;
  packageVersion: number;
  buildingId: string;
  exportedAt: string;
  publishedAt: string | null;
  source: "mapVersion" | "generated";
  building: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    category: string | null;
  };
  floors: Array<{
    id: string;
    buildingId: string;
    name: string;
    levelNumber: number;
    description: string | null;
    accessibilityNotes: string | null;
  }>;
  nodes: Array<{
    id: string;
    buildingId: string;
    floorId: string;
    name: string;
    type: string;
    description: string | null;
    x: number;
    y: number;
    searchable: boolean;
    tags: string[];
    aliases: string[];
    accessibilityFlags: string[];
    restricted: boolean;
  }>;
  edges: Array<{
    id: string;
    buildingId: string;
    fromNodeId: string;
    toNodeId: string;
    distanceEstimate: number | null;
    walkTimeEstimate: number | null;
    directionHint: string | null;
    accessible: boolean;
    requiresStairs: boolean;
    requiresElevator: boolean;
    requiresRamp: boolean;
    restricted: boolean;
    oneWay: boolean;
  }>;
  qrCheckpoints: Array<{
    code: string;
    label: string | null;
    buildingId: string;
    floorId: string;
    nodeId: string;
    active: true;
  }>;
  searchIndex: Array<{ nodeId: string; terms: string[] }>;
}

interface BuildPackageInput {
  building: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    category: string | null;
    updatedAt?: Date;
    floors: Array<{ id: string; buildingId: string; name: string; levelNumber: number; description: string | null; accessibilityNotes: string | null }>;
    nodes: Array<{ id: string; buildingId: string; floorId: string; name: string; type: string; description: string | null; x: number; y: number; searchable: boolean; tags: string[]; aliases: string[]; accessibilityFlags: string[]; restricted: boolean }>;
    edges: Array<{ id: string; buildingId: string; fromNodeId: string; toNodeId: string; distanceEstimate: number | null; walkTimeEstimate: number | null; directionHint: string | null; accessible: boolean; requiresStairs: boolean; requiresElevator: boolean; requiresRamp: boolean; restricted: boolean; oneWay: boolean }>;
    qrCheckpoints: Array<{ code: string; label: string | null; buildingId: string; floorId: string; nodeId: string; active: boolean }>;
  };
  packageVersion: number;
  publishedAt: Date | null;
  source: "mapVersion" | "generated";
}

export function buildOfflinePackage({ building, packageVersion, publishedAt, source }: BuildPackageInput): OfflineBuildingPackage {
  const nodeIds = new Set(building.nodes.map((node) => node.id));
  const floorIds = new Set(building.floors.map((floor) => floor.id));
  const clientNodes = building.nodes.filter((node) => node.searchable && !node.restricted && floorIds.has(node.floorId));
  const clientNodeIds = new Set(clientNodes.map((node) => node.id));
  const publicNodeIds = new Set(clientNodes.map((node) => node.id));
  const clientEdges = building.edges.filter((edge) => !edge.restricted && clientNodeIds.has(edge.fromNodeId) && clientNodeIds.has(edge.toNodeId));

  return {
    schemaVersion: OFFLINE_PACKAGE_SCHEMA_VERSION,
    packageVersion,
    buildingId: building.id,
    exportedAt: new Date().toISOString(),
    publishedAt: publishedAt?.toISOString() ?? null,
    source,
    building: {
      id: building.id,
      name: building.name,
      slug: building.slug,
      description: building.description,
      address: building.address,
      latitude: building.latitude,
      longitude: building.longitude,
      category: building.category,
    },
    floors: building.floors,
    nodes: clientNodes,
    edges: clientEdges,
    qrCheckpoints: building.qrCheckpoints
      .filter((checkpoint) => checkpoint.active && checkpoint.buildingId === building.id && floorIds.has(checkpoint.floorId) && nodeIds.has(checkpoint.nodeId) && publicNodeIds.has(checkpoint.nodeId))
      .map((checkpoint) => ({ ...checkpoint, active: true })),
    searchIndex: clientNodes.filter((node) => node.searchable).map((node) => ({
      nodeId: node.id,
      terms: Array.from(new Set([node.name, node.type, node.description, ...node.aliases, ...node.tags].filter((term): term is string => Boolean(term)).map((term) => term.toLowerCase()))),
    })),
  };
}

export function readSnapshotVersion(snapshot: Prisma.JsonValue): number | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const version = (snapshot as { packageVersion?: unknown; schemaVersion?: unknown }).packageVersion;
  return typeof version === "number" && Number.isInteger(version) && version > 0 ? version : null;
}
