// src/TraceCanvas.tsx
import React, { useRef, useEffect, useState } from "react";
import type { Point, Shape } from "./types";

interface TraceCanvasProps {
  shape: Shape;
  threshold?: number;
  onComplete: (success: boolean, reward: number) => void;
}

const TraceCanvas: React.FC<TraceCanvasProps> = ({ shape, threshold = 20, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const userPointsRef = useRef<Point[]>([]);
  const offsetRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

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
    const success = evaluateTrace(userPointsRef.current, shape, threshold);
    onComplete(success, shape.reward);
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

    // draw shape
    if (shape.type === "polygon") {
      const pts = (shape as any).points as Point[];
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
    } else if (shape.type === "circle") {
      const circ = shape as any;
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
  }, [shape]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", touchAction: "none", display: "block" }}
      onPointerDown={startDraw}
      onPointerMove={draw}
      onPointerUp={endDraw}
      onPointerLeave={endDraw}
    />
  );
};

function evaluateTrace(userPts: Point[], shape: Shape, threshold: number): boolean {
  if (userPts.length === 0) return false;
  if (shape.type === "polygon") {
    const pts = (shape as any).points as Point[];
    for (const up of userPts) {
      let minDist2 = Infinity;
      for (const tp of pts) {
        const dx = up.x - tp.x;
        const dy = up.y - tp.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < minDist2) minDist2 = d2;
      }
      if (Math.sqrt(minDist2) > threshold) {
        return false;
      }
    }
    return true;
  } else if (shape.type === "circle") {
    const circ = shape as any;
    const { center, radius } = circ;
    for (const up of userPts) {
      const dx = up.x - center.x;
      const dy = up.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (Math.abs(dist - radius) > threshold) {
        return false;
      }
    }
    return true;
  }
  return false;
}

export default TraceCanvas;
