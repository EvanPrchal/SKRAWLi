import type { Minigame, Shape, Point } from "./types";

// Helper function to get random number within a range
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Function to create a random point within canvas bounds
const randomPoint = (padding: number = 50) => {
  const canvasWidth = 800;  // Virtual canvas width
  const canvasHeight = 600; // Virtual canvas height
  return {
    x: random(padding, canvasWidth - padding),
    y: random(padding, canvasHeight - padding)
  };
};

// Function to generate a random horizontal line
const createRandomLine = (): Shape => {
  const y = random(100, 500);
  const x1 = random(100, 500);
  const length = random(200, 300);

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
  const topLeft = randomPoint(100);
  const size = random(150, 200);
  
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

// Function to generate a random triangle
// Function to generate a random triangle
const createRandomTriangle = (): Shape => {
  const centerX = random(250, 350);
  const centerY = random(250, 350);
  const size = random(80, 120);
  
  return {
    id: "triangle",
    type: "polygon" as const,
    points: [
      { x: centerX, y: centerY - size }, // top
      { x: centerX + size, y: centerY + size }, // bottom right
      { x: centerX - size, y: centerY + size }, // bottom left
      { x: centerX, y: centerY - size }, // back to top to close
    ],
    reward: 10,
  };
};

// Function to generate a random circle
const createRandomCircle = (): Shape => {
  const center = randomPoint(100); // Larger padding for circle
  const radius = random(50, 80);
  
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
    id: "m3",
    name: "Draw the Triangles",
    type: "traceShape",
    shapes: generateRandomShapes(createRandomTriangle),
    currentShapeIndex: 0,
    threshold: 40,
    totalReward: 10,
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