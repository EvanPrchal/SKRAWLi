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
};

export type CircleShape = {
  id: string;
  type: "circle";
  center: Point;
  radius: number;
  reward: number;
};

export type Shape = PolygonShape | CircleShape;

