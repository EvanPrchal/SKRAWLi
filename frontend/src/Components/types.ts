// src/types.ts
export type Point = {
  x: number;
  y: number;
};

export type PolygonShape = {
  id: string;
  type: "polygon";
  points: Point[];
  reward: number;
  style?: "default" | "dots";
  strokeColor?: string;
  renderOrder?: "under" | "over";
};

export type CircleShape = {
  id: string;
  type: "circle";
  center: Point;
  radius: number;
  reward: number;
  strokeColor?: string;
  renderOrder?: "under" | "over";
};

export type EllipseShape = {
  id: string;
  type: "ellipse";
  center: Point;
  radiusX: number;
  radiusY: number;
  rotation?: number;
  reward: number;
  strokeColor?: string;
  renderOrder?: "under" | "over";
};

export type Shape = PolygonShape | CircleShape | EllipseShape;

export type Minigame = {
  id: string;
  name: string;
  type: "traceShape";
  shapes: Shape[];
  currentShapeIndex: number;
  threshold: number;
  totalReward: number;
  guides?: Shape[];
  transitionLabel?: string;
};

