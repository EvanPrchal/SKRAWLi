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
  resetToken?: number;
}

const TraceCanvas: React.FC<TraceCanvasProps> = ({ shapes, currentShapeIndex, threshold = 20, currentTime, onComplete, guides, resetToken }) => {
  const currentShape = shapes[currentShapeIndex];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const userPointsRef = useRef<Point[]>([]);
  // Accumulate completed strokes for current shape so drawings persist and coverage can build progressively.
  const completedStrokesRef = useRef<{ points: Point[]; brush: string }[]>([]);
  // Strokes from past shapes retained for visual continuity (excluded from evaluation for new shape)
  const pastShapeStrokesRef = useRef<{ shapeIndex: number; strokes: { points: Point[]; brush: string }[] }[]>([]);
  const lastShapeIndexRef = useRef<number>(currentShapeIndex);
  const currentStrokeBrushRef = useRef<string>("smooth");
  // Track whether current shape was successfully completed; used to decide archiving.
  const shapeCompletedRef = useRef<boolean>(false);
  const offsetRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });
  const [brushType, setBrushType] = useState<string>("smooth");
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

  const pointerSize = (() => {
    switch (brushType) {
      case "pixel":
        return 8;
      case "rainbow":
        return 6;
      default:
        return 5;
    }
  })();

  const pointerIsSquare = brushType === "pixel";
  const pointerBorderColor = pointerIsSquare ? "#241f21" : "rgba(36,31,33,0.85)";
  const pointerFillColor = pointerIsSquare ? "rgba(36,31,33,0.25)" : "rgba(255,255,255,0.12)";

  const updatePointerIndicator = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setPointerPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

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
    updatePointerIndicator(e);
    const pt = getRelativePoint(e);
    userPointsRef.current = [pt];
    currentStrokeBrushRef.current = brushType; // capture brush at stroke start
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updatePointerIndicator(e);
    if (!isDrawing) return;
    const pt = getRelativePoint(e);
    userPointsRef.current.push(pt);
    drawCanvas();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Snapshot current stroke points
    const strokePoints = [...userPointsRef.current];
    // Evaluate only this stroke attempt (failed stroke shouldn't persist)
    const success = evaluateTrace(strokePoints, currentShape, threshold);
    onComplete(success, currentShape.reward);
    if (success) {
      // Persist successful stroke for this shape
      completedStrokesRef.current.push({ points: strokePoints, brush: currentStrokeBrushRef.current });
      shapeCompletedRef.current = true;
    } else {
      // Failed attempt: do not keep its points
      // (Optionally could provide visual feedback here)
    }
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

    // Helper to render a stroke
    const renderStroke = (pts: Point[], brush: string) => {
      if (!pts.length) return;
      if (brush === "pixel") {
        ctx.fillStyle = "#241f21";
        const pixelSize = 8;
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i];
          ctx.fillRect(pt.x - pixelSize / 2, pt.y - pixelSize / 2, pixelSize, pixelSize);
          if (i > 0) {
            const prev = pts[i - 1];
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
      } else if (brush === "rainbow") {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 6;
        for (let i = 1; i < pts.length; i++) {
          const prev = pts[i - 1];
          const pt = pts[i];
          const hue = (i * 12) % 360;
          ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = "#241f21";
        ctx.lineWidth = 5;
        ctx.stroke();
      }
    };
    // Render strokes from past shapes first
    for (const past of pastShapeStrokesRef.current) {
      for (const stroke of past.strokes) {
        renderStroke(stroke.points, stroke.brush);
      }
    }
    // Render persisted strokes for current shape
    for (const stroke of completedStrokesRef.current) {
      renderStroke(stroke.points, stroke.brush);
    }
    // Render current in-progress stroke
    renderStroke(userPointsRef.current, brushType);
  };

  // Clear all drawn data when a reset token is provided (e.g. on life loss)
  useEffect(() => {
    if (resetToken === undefined) return;
    userPointsRef.current = [];
    completedStrokesRef.current = [];
    pastShapeStrokesRef.current = [];
    shapeCompletedRef.current = false;
    drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  useEffect(() => {
    // Archive strokes from previous shape so they remain visible.
    if (currentShapeIndex !== lastShapeIndexRef.current) {
      // Only archive if shape completed successfully; otherwise discard strokes.
      if (shapeCompletedRef.current && completedStrokesRef.current.length) {
        pastShapeStrokesRef.current.push({
          shapeIndex: lastShapeIndexRef.current,
          strokes: [...completedStrokesRef.current],
        });
      }
      completedStrokesRef.current = [];
      lastShapeIndexRef.current = currentShapeIndex;
      shapeCompletedRef.current = false;
    }
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    window.addEventListener("scroll", updateCanvasSize);
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("scroll", updateCanvasSize);
    };
  }, [shapes, currentShapeIndex, guides]);

  return (
    <div className="relative w-full h-full cursor-none">
      <MiniTimer time={currentTime} show={showTimer} />
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          touchAction: "none",
          display: "block",
          cursor: "none",
        }}
        onPointerDown={startDraw}
        onPointerEnter={updatePointerIndicator}
        onPointerMove={draw}
        onPointerUp={endDraw}
        onPointerLeave={() => {
          setPointerPos(null);
          endDraw();
        }}
      />
      {pointerPos && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: pointerPos.x,
            top: pointerPos.y,
            width: `${pointerSize}px`,
            height: `${pointerSize}px`,
            transform: "translate(-50%, -50%)",
            borderRadius: pointerIsSquare ? "15%" : "9999px",
            border: "none",
            outline: `1px solid ${pointerBorderColor}`,
            backgroundColor: pointerFillColor,
            boxShadow: "0 0 2px rgba(36,31,33,0.28)",
          }}
        />
      )}
    </div>
  );
};

function evaluateTrace(userPts: Point[], shape: Shape, threshold: number): boolean {
  if (userPts.length === 0) return false;

  // Minimum points needed for a valid trace
  if (userPts.length < 10) return false;

  if (shape.type === "polygon") {
    const polygonShape = shape as PolygonShape;
    const pts = polygonShape.points;
    const isSquare = polygonShape.id.toLowerCase().includes("square");
    const distanceThreshold = isSquare ? Math.max(threshold * 0.4, 8) : threshold;
    const requiredCoverage = isSquare ? 0.95 : 0.7;

    // Calculate total shape length for coverage check
    let totalShapeLength = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      totalShapeLength += Math.sqrt(dx * dx + dy * dy);
    }

    const isSingleSegmentLine = pts.length === 2;
    const segmentLength = isSingleSegmentLine
      ? Math.sqrt((pts[1].x - pts[0].x) * (pts[1].x - pts[0].x) + (pts[1].y - pts[0].y) * (pts[1].y - pts[0].y))
      : 0;

    // Track how much of the shape has been traced
    let coveredLength = 0;
    const segmentsCovered = new Set<number>();
    let overshootDetected = false;

    // For each user point, check its proximity to shape segments
    let squareDeviation = 0;
    let squareHitCount = 0;

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

        let param = len_sq !== 0 ? dot / len_sq : -1;

        if (isSingleSegmentLine && (param < 0 || param > 1)) {
          const overshootAmount = param < 0 ? -param : param - 1;
          const overshootDistance = overshootAmount * Math.sqrt(len_sq);
          // Fail if the line extends more than 25% of original length beyond an endpoint (or well past threshold)
          const maxAllowed = Math.max(threshold * 1.1, segmentLength * 0.25);
          if (overshootDistance > maxAllowed) {
            overshootDetected = true;
          }
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
      if (minDist <= distanceThreshold) {
        if (!segmentsCovered.has(closestSegment)) {
          segmentsCovered.add(closestSegment);
          // Add approximate segment length to covered length
          const p1 = pts[closestSegment - 1];
          const p2 = pts[closestSegment];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          coveredLength += Math.sqrt(dx * dx + dy * dy);
        }
        if (isSquare) {
          squareDeviation += minDist;
          squareHitCount += 1;
        }
      }
    }

    if (totalShapeLength === 0) {
      return false;
    }

    if (overshootDetected) {
      return false;
    }

    const coverageRatio = coveredLength / totalShapeLength;

    if (isSquare) {
      const expectedSegments = pts.length > 1 ? pts.length - 1 : 0;
      if (segmentsCovered.size < expectedSegments) {
        return false;
      }
      if (squareHitCount === 0) {
        return false;
      }
      const averageDeviation = squareDeviation / squareHitCount;
      return coverageRatio >= requiredCoverage && averageDeviation <= distanceThreshold * 0.5;
    }

    // Check if enough of the shape has been covered
    return coverageRatio >= requiredCoverage;
  } else if (shape.type === "circle") {
    const circle = shape as CircleShape;
    const { center, radius } = circle;

    // Track angular coverage
    const anglesCovered = new Set<number>();
    // Make circle matching a bit more forgiving
    const angleStep = 10; // degrees per bucket (was 5)
    const requiredDegrees = 216; // 60% of 360 (was 70%)
    const effectiveThreshold = Math.max(threshold * 1.5, Math.min(18, radius * 0.12));

    for (const up of userPts) {
      const dx = up.x - center.x;
      const dy = up.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // If point is close enough to the circle's path
      if (Math.abs(dist - radius) <= effectiveThreshold) {
        // Calculate angle and add to coverage (rounded to nearest angleStep degrees)
        const angle = Math.round((((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360) / angleStep) * angleStep;
        anglesCovered.add(angle);
      }
    }

    // Check if enough of the circle has been traced (reduced coverage threshold)
    return anglesCovered.size * angleStep >= requiredDegrees;
  } else if (shape.type === "ellipse") {
    const ellipse = shape as EllipseShape;
    const { center, radiusX, radiusY } = ellipse;

    const rotation = ellipse.rotation ?? 0;
    const cosR = Math.cos(-rotation);
    const sinR = Math.sin(-rotation);

    const anglesCovered = new Set<number>();
    const angleStep = 10;
    const requiredDegrees = 216;
    const maxRadius = Math.max(radiusX, radiusY);
    const effectiveThreshold = Math.max(threshold * 1.5, Math.min(18, maxRadius * 0.12));

    for (const up of userPts) {
      const dx = up.x - center.x;
      const dy = up.y - center.y;

      // rotate point into ellipse's local frame
      const localX = dx * cosR - dy * sinR;
      const localY = dx * sinR + dy * cosR;

      const angle = Math.atan2(localY, localX);
      const distance = Math.sqrt(localX * localX + localY * localY);

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const denom = Math.sqrt(radiusY * radiusY * cosA * cosA + radiusX * radiusX * sinA * sinA);
      if (denom === 0) {
        continue;
      }
      const expectedRadius = (radiusX * radiusY) / denom;

      if (Math.abs(distance - expectedRadius) <= effectiveThreshold) {
        const bucket = Math.round((((angle * 180) / Math.PI + 360) % 360) / angleStep) * angleStep;
        anglesCovered.add(bucket);
      }
    }

    return anglesCovered.size * angleStep >= requiredDegrees;
  }

  return false;
}

export default TraceCanvas;
