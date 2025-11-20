// src/TraceCanvas.tsx
import React, { useRef, useEffect, useState } from "react";
import type { Point, Shape, PolygonShape, CircleShape, EllipseShape } from "./types";
import { canvasDimensions } from "./canvasContext";
import MiniTimer from "./MiniTimer";

interface TraceCanvasProps {
  shapes: Shape[];
  currentShapeIndex: number;
  threshold?: number;
  currentTime: number;
  onComplete: (success: boolean, reward: number) => void;
  guides?: Shape[];
}

const TraceCanvas: React.FC<TraceCanvasProps> = ({ shapes, currentShapeIndex, threshold = 20, currentTime, onComplete, guides }) => {
  const currentShape = shapes[currentShapeIndex];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const userPointsRef = useRef<Point[]>([]);
  const offsetRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });
  const [brushType, setBrushType] = useState<string>("smooth");

  // Listen for brush changes from shop
  useEffect(() => {
    const updateBrush = () => {
      const equipped = localStorage.getItem("equippedBrush") || "smooth";
      setBrushType(equipped);
    };
    updateBrush();
    window.addEventListener("brushUpdate", updateBrush);
    return () => window.removeEventListener("brushUpdate", updateBrush);
  }, []);

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

  const drawPolygon = (ctx: CanvasRenderingContext2D, polygon: PolygonShape) => {
    const pts = polygon.points;

    if (polygon.style === "dots" && pts.length === 2) {
      const dotRadius = 8;
      const fill = polygon.strokeColor ?? "#ccc";
      ctx.fillStyle = fill;
      pts.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      });
      return;
    }

    if (pts.length === 0) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = polygon.strokeColor ?? "#ccc";
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, circle: CircleShape) => {
    const strokeColor = circle.strokeColor ?? "#ccc";
    if (strokeColor === "transparent") return; // Skip drawing if transparent
    ctx.beginPath();
    ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  const drawEllipse = (ctx: CanvasRenderingContext2D, ellipse: EllipseShape) => {
    const strokeColor = ellipse.strokeColor ?? "#ccc";
    if (strokeColor === "transparent") return; // Skip drawing if transparent
    ctx.beginPath();
    ctx.ellipse(ellipse.center.x, ellipse.center.y, ellipse.radiusX, ellipse.radiusY, ellipse.rotation ?? 0, 0, 2 * Math.PI);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    if (shape.type === "polygon") {
      drawPolygon(ctx, shape as PolygonShape);
    } else if (shape.type === "circle") {
      drawCircle(ctx, shape as CircleShape);
    } else if (shape.type === "ellipse") {
      drawEllipse(ctx, shape as EllipseShape);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // clear considering CSS size
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const underGuides = guides?.filter((shape) => shape.renderOrder !== "over") ?? [];
    const overGuides = guides?.filter((shape) => shape.renderOrder === "over") ?? [];

    underGuides.forEach((shape) => drawShape(ctx, shape));

    // draw current shape
    drawShape(ctx, currentShape);

    overGuides.forEach((shape) => drawShape(ctx, shape));

    // draw user path
    const up = userPointsRef.current;
    if (up.length > 0) {
      if (brushType === "pixel") {
        // Pixel brush: draw blocky squares
        ctx.fillStyle = "#241f21";
        const pixelSize = 8;
        for (let i = 0; i < up.length; i++) {
          const pt = up[i];
          ctx.fillRect(pt.x - pixelSize / 2, pt.y - pixelSize / 2, pixelSize, pixelSize);
          // Interpolate between points to avoid gaps
          if (i > 0) {
            const prev = up[i - 1];
            const dx = pt.x - prev.x;
            const dy = pt.y - prev.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.ceil(dist / (pixelSize * 0.6));
            for (let j = 1; j < steps; j++) {
              const t = j / steps;
              const ix = prev.x + dx * t;
              const iy = prev.y + dy * t;
              ctx.fillRect(ix - pixelSize / 2, iy - pixelSize / 2, pixelSize, pixelSize);
            }
          }
        }
      } else if (brushType === "rainbow") {
        // Rainbow brush: continuous gradient-like stroke by segment coloring
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 6;
        // Draw each segment with a hue that progresses along the path
        for (let i = 1; i < up.length; i++) {
          const prev = up[i - 1];
          const pt = up[i];
          const hue = (i * 12) % 360; // step through hues for a rainbow cycle
          ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        }
      } else {
        // Smooth brush (default)
        ctx.beginPath();
        ctx.moveTo(up[0].x, up[0].y);
        for (let i = 1; i < up.length; i++) {
          ctx.lineTo(up[i].x, up[i].y);
        }
        ctx.strokeStyle = "#241f21";
        ctx.lineWidth = 5;
        ctx.stroke();
      }
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
  }, [shapes, currentShapeIndex, guides]);

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
    const circle = shape as CircleShape;
    const { center, radius } = circle;

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
  } else if (shape.type === "ellipse") {
    const ellipse = shape as EllipseShape;
    const { center, radiusX, radiusY } = ellipse;

    const anglesCovered = new Set<number>();
    const maxRadius = Math.max(radiusX, radiusY);
    const normalizedThreshold = threshold / maxRadius;

    for (const up of userPts) {
      const dx = up.x - center.x;
      const dy = up.y - center.y;
      const normalizedDistance = Math.sqrt((dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY));

      if (Math.abs(normalizedDistance - 1) <= normalizedThreshold) {
        const angle = Math.round((((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360) / 5) * 5;
        anglesCovered.add(angle);
      }
    }

    return anglesCovered.size * 5 >= 252;
  }

  return false;
}

export default TraceCanvas;
