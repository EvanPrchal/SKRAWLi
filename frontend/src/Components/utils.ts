// src/Components/utils.ts
import type { Shape, Point } from "./types";
import { shapes as allShapes } from "./shapes";

// deep clone
export function cloneShape(shape: Shape): Shape {
  return JSON.parse(JSON.stringify(shape));
}

// Randomize size & position of a shape given canvas dimensions
export function randomizeShape(
  baseShape: Shape,
  canvasWidth: number,
  canvasHeight: number
): Shape {
  const newShape = cloneShape(baseShape);
  const minScale = 0.5;
  const maxScale = 1.5;
  const scale = minScale + Math.random() * (maxScale - minScale);

  if (newShape.type === "polygon") {
    const pts = newShape.points as Point[];
    // bounding box of original (pre-scale)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const width = (maxX - minX) * scale;
    const height = (maxY - minY) * scale;

    const maxOffsetX = Math.max(canvasWidth - width, 0);
    const maxOffsetY = Math.max(canvasHeight - height, 0);
    const offsetX = Math.random() * maxOffsetX - minX * scale;
    const offsetY = Math.random() * maxOffsetY - minY * scale;

    for (const p of pts) {
      p.x = p.x * scale + offsetX;
      p.y = p.y * scale + offsetY;
    }
  } else if (newShape.type === "circle") {
    const circ = newShape as any;
    circ.radius = circ.radius * scale;
    circ.center.x = circ.radius + Math.random() * Math.max(canvasWidth - 2 * circ.radius, 0);
    circ.center.y = circ.radius + Math.random() * Math.max(canvasHeight - 2 * circ.radius, 0);
  }

  return newShape;
}

// Shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const randomizeColor = () => {
  let bgColor = "bg-skrawl-purple"
  let loadingColor: 0 | 1 | 2 = Math.floor(Math.random() * 3) as 0 | 1 | 2;
  if (loadingColor === 0) {
    bgColor = "bg-skrawl-magenta";
  } else if (loadingColor === 1) {
    bgColor = "bg-skrawl-cyan";
  } else {
    bgColor = "bg-skrawl-orange";
  }
  return bgColor
}