import { useCallback, useEffect, useRef, useState } from "react";
import NavigationHeader from "./Components/NavigationHeader";
import { useTheme } from "./lib/theme";
import { useApi } from "./lib/api";
import Loading from "./Components/Loading";
import { useDataReady } from "./lib/useDataReady";
import { useAuth0 } from "@auth0/auth0-react";

type BrushEffect = "normal" | "rainbow" | "pixel";

type StrokePoint = { x: number; y: number; hue?: number };
type Stroke = { brush: BrushEffect; color: string; size: number; erase: boolean; points: StrokePoint[] };

const ERASE_COLOR = "rgba(0,0,0,1)";
const SMOOTH_SEGMENTS_PER_CURVE = 10; // Number of Catmull–Rom samples inserted per segment

const appendPointToStroke = (stroke: Stroke, x: number, y: number) => {
  switch (stroke.brush) {
    case "pixel": {
      if (!stroke.points.length) {
        stroke.points.push({ x, y });
        return;
      }
      const last = stroke.points[stroke.points.length - 1];
      const dx = x - last.x;
      const dy = y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = Math.max(1, stroke.size * 0.6);
      const steps = Math.max(1, Math.floor(dist / step));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        stroke.points.push({ x: last.x + dx * t, y: last.y + dy * t });
      }
      return;
    }
    case "rainbow": {
      const hue = (stroke.points.length * 12) % 360;
      stroke.points.push({ x, y, hue });
      return;
    }
    default: {
      stroke.points.push({ x, y });
      return;
    }
  }
};

const clonePoint = (pt: StrokePoint): StrokePoint => ({ x: pt.x, y: pt.y, hue: pt.hue });

const sampleCatmullRom = (p0: StrokePoint, p1: StrokePoint, p2: StrokePoint, p3: StrokePoint, t: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  return { x, y };
};

const generateSmoothPoints = (points: StrokePoint[], segmentsPerCurve = SMOOTH_SEGMENTS_PER_CURVE) => {
  if (points.length < 2) return points.map(clonePoint);

  const smooth: StrokePoint[] = [clonePoint(points[0])];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    for (let step = 1; step <= segmentsPerCurve; step++) {
      const t = step / segmentsPerCurve;
      const { x, y } = sampleCatmullRom(p0, p1, p2, p3, t);
      smooth.push({ x, y });
    }
  }

  return smooth;
};

const createSmoothPath = (ctx: CanvasRenderingContext2D, points: StrokePoint[]) => {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
};

const renderStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
  if (!stroke.points.length) return;

  ctx.save();
  ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";

  switch (stroke.brush) {
    case "pixel": {
      ctx.fillStyle = stroke.erase ? ERASE_COLOR : stroke.color;
      const points = stroke.points;
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        ctx.fillRect(point.x - stroke.size / 2, point.y - stroke.size / 2, stroke.size, stroke.size);
        if (i > 0) {
          const prev = points[i - 1];
          const dx = point.x - prev.x;
          const dy = point.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const step = Math.max(1, stroke.size * 0.6);
          const steps = Math.max(1, Math.floor(dist / step));
          for (let j = 1; j < steps; j++) {
            const t = j / steps;
            const ix = prev.x + dx * t;
            const iy = prev.y + dy * t;
            ctx.fillRect(ix - stroke.size / 2, iy - stroke.size / 2, stroke.size, stroke.size);
          }
        }
      }
      break;
    }
    case "rainbow": {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = stroke.size;
      const shouldSmooth = stroke.points.length >= 3;
      const points = shouldSmooth ? generateSmoothPoints(stroke.points) : stroke.points;
      if (points.length === 1) {
        const baseHue = stroke.points[0]?.hue ?? 0;
        const color = stroke.erase ? ERASE_COLOR : `hsl(${baseHue}, 100%, 50%)`;
        ctx.fillStyle = color;
        const point = points[0];
        ctx.beginPath();
        ctx.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      const smoothingFactor = shouldSmooth ? SMOOTH_SEGMENTS_PER_CURVE : 1;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const current = points[i];
        const baseIndex = Math.min(stroke.points.length - 1, Math.floor(i / smoothingFactor));
        const hue = stroke.points[baseIndex]?.hue ?? (baseIndex * 12) % 360;
        ctx.strokeStyle = stroke.erase ? ERASE_COLOR : `hsl(${hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();
      }
      break;
    }
    default: {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = stroke.size;
      ctx.strokeStyle = stroke.erase ? ERASE_COLOR : stroke.color;
      const shouldSmooth = stroke.points.length >= 3;
      const points = shouldSmooth ? generateSmoothPoints(stroke.points) : stroke.points;
      if (points.length === 1) {
        const point = points[0];
        ctx.fillStyle = stroke.erase ? ERASE_COLOR : stroke.color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      createSmoothPath(ctx, points);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
  ctx.globalAlpha = 1;
};

const FreeDraw = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const api = useApi();
  const { isAuthenticated } = useAuth0();

  const [color, setColor] = useState<string>("#1C0667");
  const [prevColor, setPrevColor] = useState<string>("#1C0667");
  const [size, setSize] = useState<number>(6);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [presets, setPresets] = useState<string[]>(["#1C0667", "#E81E65", "#FF9F1C", "#2EC4B6", "#ffffff"]);
  const [ownedBrushes, setOwnedBrushes] = useState<string[]>([]);
  const [ownedBrushesLoaded, setOwnedBrushesLoaded] = useState<boolean>(false);
  const [activeBrush, setActiveBrush] = useState<BrushEffect>("normal");
  const isDrawingRef = useRef<boolean>(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const redoStackRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const drawingSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setOwnedBrushes([]);
      setOwnedBrushesLoaded(true);
      return;
    }
    api
      .getOwnedItems()
      .then((items) => {
        const brushes = items.filter((item) => item.item_id.includes("brush")).map((item) => item.item_id);
        setOwnedBrushes(brushes);
        setOwnedBrushesLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load owned brushes:", err);
        setOwnedBrushesLoaded(true);
      });
  }, [isAuthenticated, api]);

  const getEffectiveColor = () => {
    if (isEraser) return "#ffffff";
    if (activeBrush === "rainbow") {
      const dynamicHue = Math.floor((Date.now() / 30) % 360);
      return `hsl(${dynamicHue}, 100%, 60%)`;
    }
    return color;
  };

  useEffect(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const getVar = (name: string) => styles.getPropertyValue(name).trim() || undefined;
    const themedPresets = [
      getVar("--color-skrawl-purple"),
      getVar("--color-skrawl-magenta"),
      getVar("--color-skrawl-orange"),
      getVar("--color-skrawl-cyan"),
      getVar("--color-skrawl-white"),
    ].filter(Boolean) as string[];
    if (themedPresets.length) setPresets(themedPresets);
  }, [theme]);

  const drawCanvas = useCallback(
    (previewStroke?: Stroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const renderQueue = previewStroke ? [...strokes, previewStroke] : strokes;
      for (const stroke of renderQueue) {
        renderStroke(ctx, stroke);
      }
    },
    [strokes]
  );

  const ensureCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const surface = drawingSurfaceRef.current;
    if (!canvas || !surface) return;
    const rect = surface.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }, []);

  const updateCursorIndicator = useCallback((event: React.PointerEvent) => {
    const surface = drawingSurfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    setCursorPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }, []);

  const handleSurfacePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    updateCursorIndicator(event);
  };

  const handleSurfacePointerLeave = () => {
    if (isDrawingRef.current) {
      endCurrentStroke();
    }
    setCursorPos(null);
  };

  useEffect(() => {
    const handleResize = () => {
      ensureCanvasSize();
      drawCanvas(currentStrokeRef.current);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [ensureCanvasSize, drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const endCurrentStroke = useCallback(() => {
    const stroke = currentStrokeRef.current;
    if (stroke && stroke.points.length) {
      setStrokes((prev) => [...prev, stroke]);
    }
    currentStrokeRef.current = null;
    isDrawingRef.current = false;
  }, []);

  const getCanvasPosition = (event: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    ensureCanvasSize();
    updateCursorIndicator(e);
    const { x, y } = getCanvasPosition(e);
    const strokeSize = size;
    const strokeColor = getEffectiveColor();
    const stroke: Stroke = {
      brush: activeBrush,
      color: strokeColor,
      size: strokeSize,
      erase: isEraser,
      points: [],
    };
    redoStackRef.current = [];
    appendPointToStroke(stroke, x, y);
    currentStrokeRef.current = stroke;
    isDrawingRef.current = true;
    drawCanvas(stroke);
    (e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    updateCursorIndicator(e);
    if (!isDrawingRef.current) return;
    const stroke = currentStrokeRef.current;
    if (!stroke) return;
    const { x, y } = getCanvasPosition(e);
    appendPointToStroke(stroke, x, y);
    drawCanvas(stroke);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) {
      updateCursorIndicator(e);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    endCurrentStroke();
    updateCursorIndicator(e);
    (e.target as HTMLCanvasElement).releasePointerCapture?.(e.pointerId);
  };

  const handleCanvasPointerLeave = () => {
    if (isDrawingRef.current) {
      endCurrentStroke();
    }
    setCursorPos(null);
  };

  const handleCanvasPointerCancel = () => {
    if (isDrawingRef.current) {
      endCurrentStroke();
    }
    setCursorPos(null);
  };

  const handleUndo = () => {
    setStrokes((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      const removed = next.pop();
      if (removed) redoStackRef.current.push(removed);
      return next;
    });
    currentStrokeRef.current = null;
  };

  const handleRedo = () => {
    const stroke = redoStackRef.current.pop();
    if (!stroke) return;
    setStrokes((prev) => [...prev, stroke]);
  };

  const handleClear = () => {
    redoStackRef.current = [];
    currentStrokeRef.current = null;
    setStrokes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `skrawli-freedraw-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("Failed to export image", e);
      alert("Could not save image. Try again.");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "b") {
        setIsEraser(false);
      } else if (key === "e") {
        setIsEraser(true);
      } else if (key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const containerBgClass = "bg-skrawl-magenta";
  const ready = useDataReady([ownedBrushesLoaded]);
  if (!ready) return <Loading />;

  const previewSize = Math.max(4, size);

  return (
    <div className={`min-h-screen ${containerBgClass} bg-[url('/src/assets/images/background.png')] bg-cover font-body`}>
      <NavigationHeader />

      <div className="mx-auto max-w-7xl p-4 h-[calc(100vh-80px)]">
        <div className="w-full h-full flex gap-4">
          <div
            className="flex-1 bg-skrawl-white rounded-md border border-skrawl-purple/20 overflow-hidden flex relative font-body cursor-none"
            ref={drawingSurfaceRef}
            onPointerMove={handleSurfacePointerMove}
            onPointerLeave={handleSurfacePointerLeave}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerLeave}
              onPointerCancel={handleCanvasPointerCancel}
              style={{
                flex: 1,
                touchAction: "none",
                width: "100%",
                height: "100%",
                backgroundColor: "#ffffff",
                cursor: "none",
              }}
            />
            {activeBrush !== "normal" && !isEraser && (
              <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-body">
                {activeBrush === "rainbow" && "🌈 Rainbow"}
                {activeBrush === "pixel" && "🟦 Pixel"}
              </div>
            )}
            {cursorPos && (
              <div
                className="pointer-events-none absolute border-2 cursor-none"
                style={{
                  left: cursorPos.x,
                  top: cursorPos.y,
                  width: `${previewSize}px`,
                  height: `${previewSize}px`,
                  borderRadius: activeBrush === "pixel" ? "12%" : "9999px",
                  borderColor: isEraser ? "#E81E65" : getEffectiveColor(),
                  transform: "translate(-50%, -50%)",
                  boxShadow: isEraser ? "0 0 0 1px rgba(28,6,103,0.15)" : "none",
                  backgroundColor: isEraser ? "rgba(255,255,255,0.2)" : "transparent",
                }}
              />
            )}
          </div>

          <aside className="w-72 bg-skrawl-white rounded-md border border-skrawl-purple/20 p-4 flex flex-col gap-4">
            {isAuthenticated && ownedBrushes.length > 0 && (
              <div className="flex flex-col gap-2 pb-3 border-b border-gray-200">
                <label className="text-body font-body text-skrawl-purple">Brush Effect</label>
                <select
                  value={activeBrush}
                  onChange={(e) => setActiveBrush(e.target.value as BrushEffect)}
                  className="px-3 py-2 rounded-md border border-skrawl-purple/40 bg-white text-skrawl-purple font-body text-sm focus:outline-none focus:ring-2 focus:ring-skrawl-magenta"
                >
                  <option value="normal">Normal</option>
                  {ownedBrushes.includes("rainbow-brush") && <option value="rainbow">🌈 Rainbow</option>}
                  {ownedBrushes.includes("pixel-brush") && <option value="pixel">🟦 Pixel Brush</option>}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-body font-body text-skrawl-purple">Mode</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEraser(false)}
                  className={`px-3 py-1 rounded-md border font-body text-sm ${
                    !isEraser ? "bg-skrawl-purple text-white border-skrawl-purple" : "bg-white text-skrawl-purple border-skrawl-purple/40"
                  }`}
                  title="Brush (B)"
                >
                  Pencil
                </button>
                <button
                  onClick={() => setIsEraser(true)}
                  className={`px-3 py-1 rounded-md border font-body text-sm ${
                    isEraser ? "bg-skrawl-purple text-white border-skrawl-purple" : "bg-white text-skrawl-purple border-skrawl-purple/40"
                  }`}
                  title="Eraser (E)"
                >
                  Eraser
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-body font-body text-skrawl-purple">Brush Size: {size}px</label>
              <input
                type="range"
                min={1}
                max={40}
                step={1}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-skrawl-cyan"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-body font-body text-skrawl-purple">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPrevColor(color);
                    setColor(next);
                  }}
                  disabled={isEraser || activeBrush === "rainbow"}
                  className="w-10 h-10 p-1 rounded cursor-pointer border border-gray-300 disabled:opacity-60"
                  title={activeBrush === "rainbow" ? "Color auto-changes with rainbow brush" : "Pick stroke color"}
                />
                <div className="relative">
                  <button
                    type="button"
                    title="Use previous color (swap)"
                    onClick={() => {
                      const current = color;
                      const previous = prevColor;
                      setColor(previous);
                      setPrevColor(current);
                    }}
                    disabled={activeBrush === "rainbow"}
                    className="w-6 h-6 rounded-full border border-gray-300 shadow-sm hover:ring-2 hover:ring-skrawl-magenta focus:outline-none disabled:opacity-60"
                    style={{ backgroundColor: prevColor }}
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm select-none">
                    ↔
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-body font-body text-skrawl-purple">Presets</label>
              <div className="flex flex-wrap gap-2">
                {presets.map((c) => (
                  <button
                    key={c}
                    className={`w-7 h-7 rounded-full border ${
                      c.toLowerCase() === color.toLowerCase() ? "ring-2 ring-skrawl-magenta" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: c }}
                    disabled={isEraser || activeBrush === "rainbow"}
                    title={c}
                    onClick={() => {
                      setPrevColor(color);
                      setColor(c);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <button
                onClick={handleUndo}
                className="px-3 py-2 rounded-md bg-white border border-skrawl-purple/40 hover:bg-skrawl-white font-body text-body"
                title="Undo (⌘/Ctrl+Z)"
              >
                Undo
              </button>
              <button
                onClick={handleRedo}
                className="px-3 py-2 rounded-md bg-white border border-skrawl-purple/40 hover:bg-skrawl-white font-body text-body"
                title="Redo (Shift+⌘/Ctrl+Z)"
              >
                Redo
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta font-body text-body"
                title="Clear canvas"
              >
                Clear
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta font-body text-body"
                title="Save PNG"
              >
                Save PNG
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default FreeDraw;
