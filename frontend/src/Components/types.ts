// src/types.ts
export type Point = {
  x: number;
  y: number;
};

export type Shape = {
  id: string;
  points: Point[];
  reward: number;
};
