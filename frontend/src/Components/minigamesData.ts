import type { Minigame, Point, Shape } from "./types";
import { canvasDimensions } from "./canvasContext";

// Helper function to get random number within a range
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Function to create a random point within canvas bounds
const randomPoint = (padding: number = 50) => {
  const { width, height } = canvasDimensions;
  const scaledPadding = Math.min(padding, Math.min(width, height) * 0.1); // Scale padding with canvas size
  return {
    x: random(scaledPadding, width - scaledPadding),
    y: random(scaledPadding, height - scaledPadding)
  };
};

const randomPointWithin = (padding: number) => {
  const { width, height } = canvasDimensions;
  return {
    x: random(padding, width - padding),
    y: random(padding, height - padding),
  };
};

const rotateAroundOrigin = (point: Point, angle: number): Point => ({
  x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
  y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
});

const translatePoint = (point: Point, offset: Point): Point => ({
  x: point.x + offset.x,
  y: point.y + offset.y,
});

// Function to generate a random horizontal line
const createRandomLine = (): Shape => {
  const { width, height } = canvasDimensions;
  const padding = Math.min(width, height) * 0.12;
  const length = random(width * 0.2, width * 0.4);
  const halfLength = length / 2;
  const angle = Math.random() * Math.PI * 2;

  let attempts = 0;
  while (attempts < 20) {
    const center = randomPointWithin(padding + halfLength);
    const dx = Math.cos(angle) * halfLength;
    const dy = Math.sin(angle) * halfLength;
    const start = { x: center.x - dx, y: center.y - dy };
    const end = { x: center.x + dx, y: center.y + dy };

    if (
      start.x >= padding && start.x <= width - padding &&
      start.y >= padding && start.y <= height - padding &&
      end.x >= padding && end.x <= width - padding &&
      end.y >= padding && end.y <= height - padding
    ) {
      return {
        id: "angledLine",
        type: "polygon" as const,
        points: [start, end],
        reward: 5,
      };
    }

    attempts += 1;
  }

  // Fallback to horizontal line if placement fails repeatedly
  const fallbackY = random(padding, height - padding);
  const fallbackX = random(padding, width * 0.6);
  return {
    id: "horizontalLine",
    type: "polygon" as const,
    points: [
      { x: fallbackX, y: fallbackY },
      { x: fallbackX + length, y: fallbackY },
    ],
    reward: 5,
  };
};

// Function to generate a random square
const createRandomSquare = (): Shape => {
  const { width, height } = canvasDimensions;
  const maxSize = Math.min(width, height) * 0.3; // 30% of smallest dimension
  const size = random(maxSize * 0.5, maxSize);
  const halfSize = size / 2;
  const diagonalRadius = Math.sqrt(2) * halfSize;
  const padding = diagonalRadius + Math.min(width, height) * 0.05;
  const angle = Math.random() * Math.PI * 2;

  let attempts = 0;
  while (attempts < 20) {
    const center = randomPointWithin(padding);
    const localCorners: Point[] = [
      { x: -halfSize, y: -halfSize },
      { x: halfSize, y: -halfSize },
      { x: halfSize, y: halfSize },
      { x: -halfSize, y: halfSize },
    ];

    const rotatedCorners = localCorners.map((corner) => translatePoint(rotateAroundOrigin(corner, angle), center));
    if (rotatedCorners.every((corner) => corner.x >= padding && corner.x <= width - padding && corner.y >= padding && corner.y <= height - padding)) {
      return {
        id: "rotatedSquare",
        type: "polygon" as const,
        points: [...rotatedCorners, rotatedCorners[0]],
        reward: 15,
      };
    }

    attempts += 1;
  }

  // Fallback to axis-aligned square if placement fails
  const fallbackTopLeft = randomPoint(size * 0.5);
  return {
    id: "square",
    type: "polygon" as const,
    points: [
      fallbackTopLeft,
      { x: fallbackTopLeft.x + size, y: fallbackTopLeft.y },
      { x: fallbackTopLeft.x + size, y: fallbackTopLeft.y + size },
      { x: fallbackTopLeft.x, y: fallbackTopLeft.y + size },
      { x: fallbackTopLeft.x, y: fallbackTopLeft.y },
    ],
    reward: 15,
  };
};

// Function to generate a random circle
const createRandomCircle = (): Shape => {
  const { width, height } = canvasDimensions;
  const maxRadius = Math.min(width, height) * 0.15; // 15% of smallest dimension
  const radius = random(maxRadius * 0.6, maxRadius);
  const padding = radius * 1.2; // Extra padding to ensure circle fits
  const center = randomPoint(padding);
  
  return {
    id: "circle",
    type: "circle" as const,
    center,
    radius,
    reward: 20,
  };
};

// Function to generate random number of shapes (1-5) of the specified type
const generateRandomShapes = (createShape: () => Shape): Shape[] => {
  const count = random(1, 5);
  return Array.from({ length: count }, () => createShape());
};

let connectDotsCounter = 0;

const withinBounds = (point: Point, padding: number): boolean => {
  const { width, height } = canvasDimensions;
  return point.x >= padding && point.x <= width - padding && point.y >= padding && point.y <= height - padding;
};

const createConnectDotsLine = (): Shape => {
  const { width, height } = canvasDimensions;
  const padding = Math.min(width, height) * 0.15;
  const maxLength = Math.min(width, height) * 0.35;
  const minLength = Math.min(width, height) * 0.18;

  let start = randomPoint(padding);
  let end: Point | null = null;
  let attempts = 0;

  while (attempts < 12) {
    const length = random(minLength, maxLength);
    const angle = Math.random() * Math.PI * 2;
    const candidateEnd: Point = {
      x: start.x + Math.cos(angle) * length,
      y: start.y + Math.sin(angle) * length,
    };

    if (withinBounds(candidateEnd, padding)) {
      end = candidateEnd;
      break;
    }

    start = randomPoint(padding);
    attempts += 1;
  }

  if (!end) {
    end = {
      x: Math.min(Math.max(start.x + maxLength, padding), width - padding),
      y: Math.min(Math.max(start.y, padding), height - padding),
    };
  }

  return {
    id: `connectDots-${connectDotsCounter++}`,
    type: "polygon" as const,
    points: [start, end],
    reward: 8,
    style: "dots",
  };
};

// Function to get a fresh set of minigames with random shapes
export const getRandomMinigames = (): Minigame[] => [
  {
    id: "m1",
    name: "Trace the Lines",
    type: "traceShape",
    shapes: generateRandomShapes(createRandomLine),
    currentShapeIndex: 0,
    threshold: 60,
    totalReward: 5,
  },
  {
    id: "m2",
    name: "Draw the Squares",
    type: "traceShape",
    shapes: generateRandomShapes(createRandomSquare),
    currentShapeIndex: 0,
    threshold: 40,
    totalReward: 15,
  },
  (() => {
    const shapeCount = random(1, 3);
    const shapes = Array.from({ length: shapeCount }, () => createConnectDotsLine());
    const totalReward = shapes.reduce((sum, shape) => sum + shape.reward, 0);
    return {
      id: "m3",
      name: "Connect the Dots",
      type: "traceShape" as const,
      shapes,
      currentShapeIndex: 0,
      threshold: 30,
      totalReward,
    } satisfies Minigame;
  })(),
  {
    id: "m4",
    name: "Draw the Circles",
    type: "traceShape",
    shapes: generateRandomShapes(createRandomCircle),
    currentShapeIndex: 0,
    threshold: 45,
    totalReward: 20,
  },
];

// Export initial random set
export const minigames = getRandomMinigames();