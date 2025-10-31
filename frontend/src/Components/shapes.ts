// src/Components/shapes.ts
import type { Shape } from "./types";

export const shapes: Shape[] = [
    {
    id: 'square1',
    type: 'polygon',
    points: [
      { x: 50, y: 50 },
      { x: 150, y: 50 },
      { x: 150, y: 150 },
      { x: 50, y: 150 },
      { x: 50, y: 50 },  // closing the loop
    ],
    reward: 15,
  },
  {
    id: "triangle1",
    type: "polygon",
    points: [
      { x: 100, y: 50 },
      { x: 150, y: 150 },
      { x: 50,  y: 150 },
      { x: 100, y: 50 },
    ],
    reward: 10,
  },

  {
    id: "circle1",
    type: "circle",
    center: { x: 250, y: 200 },
    radius: 75,
    reward: 20,
  },
];

// extra shapes

/*
  {
    id: "pentagon1",
    type: "polygon",
    points: [
      { x: 300, y: 80  },
      { x: 340, y: 120 },
      { x: 330, y: 180 },
      { x: 270, y: 180 },
      { x: 260, y: 120 },
      { x: 300, y: 80  },
    ],
    reward: 20,
  },
    {
    id: "hexagon1",
    type: "polygon",
    points: [
      { x: 400, y: 70  },
      { x: 450, y: 110 },
      { x: 450, y: 160 },
      { x: 400, y: 200 },
      { x: 350, y: 160 },
      { x: 350, y: 110 },
      { x: 400, y: 70  },
    ],
    reward: 25,
  },
*/
