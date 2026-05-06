export interface GraphFloor {
  id: string;
  name: string;
  levelNumber: number;
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  floorId: string;
  x: number;
  y: number;
  searchable: boolean;
  restricted: boolean;
}

export interface GraphEdge {
  id: string;
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
}

export interface RouteOptions {
  accessibilityMode?: boolean;
}

export interface RouteWarning {
  code: string;
  message: string;
}

export interface RouteStep {
  fromNode: GraphNode;
  toNode: GraphNode;
  edge: GraphEdge;
  instruction: string;
  floorChange: boolean;
  targetFloorName: string | null;
}

export interface RouteResult {
  path: GraphNode[];
  steps: RouteStep[];
  totalDistanceEstimate: number;
  totalWalkTimeEstimate: number;
  floorChanges: number;
  warnings: RouteWarning[];
}
