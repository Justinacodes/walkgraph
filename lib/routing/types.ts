export interface GraphNode {
  id: string;
  name: string;
  type: string;
  floorId: string;
  x: number;
  y: number;
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

export interface RouteStep {
  fromNode: GraphNode;
  toNode: GraphNode;
  edge: GraphEdge;
  instruction: string;
}

export interface RouteResult {
  path: GraphNode[];
  steps: RouteStep[];
  totalDistanceEstimate: number;
  totalWalkTimeEstimate: number;
}
