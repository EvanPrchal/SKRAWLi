import type { Minigame, Shape, Point } from "./types";
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

// Function to generate a random horizontal line
const createRandomLine = (): Shape => {
  const { width, height } = canvasDimensions;
  const padding = Math.min(width, height) * 0.1; // 10% of smallest dimension
  const y = random(padding, height - padding);
  const x1 = random(padding, width * 0.6);
  const length = random(width * 0.2, width * 0.4); // 20-40% of width

  return {
    id: "horizontalLine",
    type: "polygon" as const,
    points: [
      { x: x1, y },
      { x: x1 + length, y },
    ],
    reward: 5,
  };
};

// Function to generate a random square
const createRandomSquare = (): Shape => {
  const { width, height } = canvasDimensions;
  const maxSize = Math.min(width, height) * 0.3; // 30% of smallest dimension
  const size = random(maxSize * 0.5, maxSize);
  const padding = size * 0.5; // Ensure enough space for the square
  const topLeft = randomPoint(padding);
  
  return {
    id: "square",
    type: "polygon" as const,
    points: [
      topLeft,
      { x: topLeft.x + size, y: topLeft.y },
      { x: topLeft.x + size, y: topLeft.y + size },
      { x: topLeft.x, y: topLeft.y + size },
      { x: topLeft.x, y: topLeft.y }, // Close the square
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