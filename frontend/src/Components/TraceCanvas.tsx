// src/TraceCanvas.tsx
import React, { useRef, useEffect, useState } from "react";
import type { Point, Shape } from "./types";
import { canvasDimensions } from "./canvasContext";
import MiniTimer from "./MiniTimer";

interface TraceCanvasProps {
  shapes: Shape[];
  currentShapeIndex: number;
  threshold?: number;
  currentTime: number;
  onComplete: (success: boolean, reward: number) => void;
}

const TraceCanvas: React.FC<TraceCanvasProps> = ({ shapes, currentShapeIndex, threshold = 20, currentTime, onComplete }) => {
  const currentShape = shapes[currentShapeIndex];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const userPointsRef = useRef<Point[]>([]);
  const offsetRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

  // Get the timer setting from localStorage, default to false if not set
  const showTimer = localStorage.getItem("showTimer") === "true";

  const updateCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
    }

    // Update the global canvas dimensions
    canvasDimensions.updateDimensions(rect.width, rect.height, dpr);

    offsetRef.current = { left: rect.left, top: rect.top };

    // redraw shape + user path
    drawCanvas();
  };

  const getRelativePoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const dpr = window.devicePixelRatio || 1;
    const { left, top } = offsetRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - left) * (canvas.width / (rect.width * dpr)),
      y: (e.clientY - top) * (canvas.height / (rect.height * dpr)),
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updateCanvasSize();
    const pt = getRelativePoint(e);
    userPointsRef.current = [pt];
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pt = getRelativePoint(e);
    userPointsRef.current.push(pt);
    drawCanvas();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const success = evaluateTrace(userPointsRef.current, currentShape, threshold);
    onComplete(success, currentShape.reward);
    userPointsRef.current = [];
    drawCanvas();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // clear considering CSS size
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw current shape
    if (currentShape.type === "polygon") {
      const pts = (currentShape as any).points as Point[];
      if (pts.length > 0) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    } else if (currentShape.type === "circle") {
      const circ = currentShape as any;
      ctx.beginPath();
      ctx.arc(circ.center.x, circ.center.y, circ.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // draw user path
    const up = userPointsRef.current;
    if (up.length > 0) {
      ctx.beginPath();
      ctx.moveTo(up[0].x, up[0].y);
      for (let i = 1; i < up.length; i++) {
        ctx.lineTo(up[i].x, up[i].y);
      }
      ctx.strokeStyle = "#241f21";
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  };

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    window.addEventListener("scroll", updateCanvasSize);
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("scroll", updateCanvasSize);
    };
  }, [shapes, currentShapeIndex]);

  return (
    <div className="relative w-full h-full">
      <MiniTimer time={currentTime} show={showTimer} />
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", touchAction: "none", display: "block" }}
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
      />
    </div>
  );
};

function evaluateTrace(userPts: Point[], shape: Shape, threshold: number): boolean {
  if (userPts.length === 0) return false;

  // Minimum points needed for a valid trace
  if (userPts.length < 10) return false;

  if (shape.type === "polygon") {
    const pts = (shape as any).points as Point[];

    // Calculate total shape length for coverage check
    let totalShapeLength = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      totalShapeLength += Math.sqrt(dx * dx + dy * dy);
    }

    // Track how much of the shape has been traced
    let coveredLength = 0;
    const segmentsCovered = new Set<number>();

    // For each user point, check its proximity to shape segments
    for (const up of userPts) {
      let minDist = Infinity;
      let closestSegment = -1;

      // Check distance to each line segment of the shape
      for (let i = 1; i < pts.length; i++) {
        const p1 = pts[i - 1];
        const p2 = pts[i];

        // Calculate distance from point to line segment
        const A = up.x - p1.x;
        const B = up.y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;

        let param = -1;
        if (len_sq !== 0) {
          param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
          xx = p1.x;
          yy = p1.y;
        } else if (param > 1) {
          xx = p2.x;
          yy = p2.y;
        } else {
          xx = p1.x + param * C;
          yy = p1.y + param * D;
        }

        const dx = up.x - xx;
        const dy = up.y - yy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) {
          minDist = dist;
          closestSegment = i;
        }
      }

      // If this point is close enough to the shape
      if (minDist <= threshold) {
        if (!segmentsCovered.has(closestSegment)) {
          segmentsCovered.add(closestSegment);
          // Add approximate segment length to covered length
          const p1 = pts[closestSegment - 1];
          const p2 = pts[closestSegment];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          coveredLength += Math.sqrt(dx * dx + dy * dy);
        }
      }
    }

    // Check if enough of the shape has been covered (70%)
    return coveredLength / totalShapeLength >= 0.7;
  } else if (shape.type === "circle") {
    const circ = shape as any;
    const { center, radius } = circ;

    // Track angular coverage
    const anglesCovered = new Set<number>();

    for (const up of userPts) {
      const dx = up.x - center.x;
      const dy = up.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // If point is close enough to the circle's path
      if (Math.abs(dist - radius) <= threshold) {
        // Calculate angle and add to coverage (rounded to nearest 5 degrees)
        const angle = Math.round((((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360) / 5) * 5;
        anglesCovered.add(angle);
      }
    }

    // Check if enough of the circle has been traced (70% of 360 degrees = 252 degrees)
    return anglesCovered.size * 5 >= 252;
  }

  return false;
}

export default TraceCanvas;
