import { useEffect, useRef, useState } from "react";
import NavigationHeader from "./Components/NavigationHeader";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { useTheme } from "./lib/theme";
import { useApi } from "./lib/api";
import { useAuth0 } from "@auth0/auth0-react";

type SketchRef = any; // fallback to keep build smooth if type is missing

type BrushEffect = "normal" | "neon-glow" | "rainbow" | "spray-paint";

const FreeDraw = () => {
  const canvasRef = useRef<SketchRef>(null);
  const { theme } = useTheme();
  const api = useApi();
  const { isAuthenticated } = useAuth0();

  const [color, setColor] = useState<string>("#241f21");
  // Track the color before the most recent selection
  const [prevColor, setPrevColor] = useState<string>("#241f21");
  const [size, setSize] = useState<number>(6);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [presets, setPresets] = useState<string[]>(["#1C0667", "#E81E65", "#FF9F1C", "#2EC4B6", "#241f21", "#ffffff"]);
  const [ownedBrushes, setOwnedBrushes] = useState<string[]>([]);
  const [activeBrush, setActiveBrush] = useState<BrushEffect>("normal");
  const [rainbowHue, setRainbowHue] = useState<number>(0);
  const rainbowIntervalRef = useRef<number | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Load owned brush effects
  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .getOwnedItems()
      .then((items) => {
        const brushes = items.filter((item) => item.item_id.includes("brush")).map((item) => item.item_id);
        setOwnedBrushes(brushes);
      })
      .catch((err) => console.error("Failed to load owned brushes:", err));
  }, [isAuthenticated, api]);

  // Sync erase mode with canvas
  useEffect(() => {
    if (canvasRef.current && typeof canvasRef.current.eraseMode === "function") {
      canvasRef.current.eraseMode(isEraser);
    }
  }, [isEraser]);

  // Rainbow brush effect - cycle hue continuously and update canvas
  useEffect(() => {
    if (activeBrush !== "rainbow" || isEraser) {
      if (rainbowIntervalRef.current) {
        clearInterval(rainbowIntervalRef.current);
        rainbowIntervalRef.current = null;
      }
      return;
    }

    // Start continuous color cycling for rainbow effect
    if (!rainbowIntervalRef.current) {
      rainbowIntervalRef.current = window.setInterval(() => {
        setRainbowHue((prev) => (prev + 3) % 360);
      }, 16); // ~60fps
    }

    return () => {
      if (rainbowIntervalRef.current) {
        clearInterval(rainbowIntervalRef.current);
        rainbowIntervalRef.current = null;
      }
    };
  }, [activeBrush, isEraser]);

  // Force update canvas stroke color for rainbow brush
  useEffect(() => {
    if (activeBrush === "rainbow" && !isEraser && canvasRef.current) {
      const newColor = `hsl(${rainbowHue}, 100%, 60%)`;
      // Access the internal canvas elements to update stroke style
      const canvasElement = canvasRef.current;
      if (canvasElement && canvasElement.canvas) {
        const ctx = canvasElement.canvas.getContext("2d");
        if (ctx) {
          ctx.strokeStyle = newColor;
        }
      }
    }
  }, [rainbowHue, activeBrush, isEraser]);

  // Get the effective color based on active brush effect
  const getEffectiveColor = () => {
    if (isEraser) return "#ffffff";
    if (activeBrush === "rainbow") {
      return `hsl(${rainbowHue}, 100%, 60%)`;
    }
    return color;
  };

  // Get the effective stroke width based on active brush effect
  const getEffectiveStrokeWidth = () => {
    if (activeBrush === "spray-paint") {
      return size * 0.5; // Thinner individual dots
    }
    if (activeBrush === "neon-glow") {
      return size * 1.2; // Slightly thicker for glow effect
    }
    return size;
  };

  // (Bat brush removed)

  // Build preset colors from current theme CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const getVar = (name: string) => styles.getPropertyValue(name).trim() || undefined;
    const themedPresets = [
      getVar("--color-skrawl-purple"),
      getVar("--color-skrawl-magenta"),
      getVar("--color-skrawl-orange"),
      getVar("--color-skrawl-cyan"),
      getVar("--color-skrawl-black"),
      getVar("--color-skrawl-white"),
    ].filter(Boolean) as string[];
    if (themedPresets.length) setPresets(themedPresets);
  }, [theme]);

  const handleClear = () => canvasRef.current?.clearCanvas?.();
  const handleUndo = () => canvasRef.current?.undo?.();
  const handleRedo = () => canvasRef.current?.redo?.();
  const handleSave = async () => {
    try {
      const dataUrl: string = await canvasRef.current?.exportImage?.("png");
      if (!dataUrl) return;
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

  // Keyboard shortcuts: B (brush), E (eraser), Cmd/Ctrl+Z (undo), Shift+Cmd/Ctrl+Z (redo)
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

  // Handle drawing state for rainbow brush
  const handlePointerDown = () => {
    isDrawingRef.current = true;
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  return (
    <div className="min-h-screen bg-skrawl-black bg-[url('/src/assets/images/background.png')] bg-cover">
      <NavigationHeader />

      <div className="mx-auto max-w-7xl p-4 h-[calc(100vh-80px)]">
        <div className="w-full h-full flex gap-4">
          {/* Canvas area (left) */}
          <div
            className="flex-1 bg-skrawl-white rounded-md border border-skrawl-purple/20 overflow-hidden flex relative"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          >
            <ReactSketchCanvas
              ref={canvasRef}
              style={{ flex: 1, minHeight: 0 }}
              width="100%"
              height="100%"
              strokeWidth={getEffectiveStrokeWidth()}
              strokeColor={getEffectiveColor()}
              canvasColor="#ffffff"
              withTimestamp={false}
              eraserWidth={size}
              className={activeBrush === "neon-glow" ? "neon-glow-canvas" : activeBrush === "spray-paint" ? "spray-paint-canvas" : ""}
            />
            {/* Brush effect indicator */}
            {activeBrush !== "normal" && !isEraser && (
              <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-body">
                {activeBrush === "neon-glow" && "✨ Neon Glow"}
                {activeBrush === "rainbow" && "🌈 Rainbow"}
                {activeBrush === "spray-paint" && "💨 Spray Paint"}
              </div>
            )}
          </div>

          {/* Sidebar toolbar (right) */}
          <aside className="w-72 bg-skrawl-white rounded-md border border-skrawl-purple/20 p-4 flex flex-col gap-4">
            {/* Brush Effect Selection */}
            {isAuthenticated && ownedBrushes.length > 0 && (
              <div className="flex flex-col gap-2 pb-3 border-b border-gray-200">
                <label className="text-body font-body text-skrawl-purple">Brush Effect</label>
                <select
                  value={activeBrush}
                  onChange={(e) => setActiveBrush(e.target.value as BrushEffect)}
                  className="px-3 py-2 rounded-md border border-skrawl-purple/40 bg-white text-skrawl-purple font-body text-sm focus:outline-none focus:ring-2 focus:ring-skrawl-cyan"
                >
                  <option value="normal">Normal</option>
                  {ownedBrushes.includes("neon-glow-brush") && <option value="neon-glow">✨ Neon Glow</option>}
                  {ownedBrushes.includes("rainbow-brush") && <option value="rainbow">🌈 Rainbow</option>}
                  {ownedBrushes.includes("spray-paint-brush") && <option value="spray-paint">💨 Spray Paint</option>}
                </select>
              </div>
            )}

            {/* Mode */}
            <div className="flex items-center justify-between">
              <span className="text-body font-body text-skrawl-purple">Mode</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEraser(false)}
                  className={`px-3 py-1 rounded-md border ${
                    !isEraser ? "bg-skrawl-purple text-white border-skrawl-purple" : "bg-white text-skrawl-purple border-skrawl-purple/40"
                  }`}
                  title="Brush (B)"
                >
                  Pencil
                </button>
                <button
                  onClick={() => setIsEraser(true)}
                  className={`px-3 py-1 rounded-md border ${
                    isEraser ? "bg-skrawl-purple text-white border-skrawl-purple" : "bg-white text-skrawl-purple border-skrawl-purple/40"
                  }`}
                  title="Eraser (E)"
                >
                  Eraser
                </button>
              </div>
            </div>

            {/* Brush size */}
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

            {/* Color picker */}
            <div className="flex flex-col gap-2">
              <label className="text-body font-body text-skrawl-purple">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPrevColor(color); // store previous
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
                    className="w-6 h-6 rounded-full border border-gray-300 shadow-sm hover:ring-2 hover:ring-skrawl-cyan focus:outline-none disabled:opacity-60"
                    style={{ backgroundColor: prevColor }}
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-sm select-none">
                    ↔
                  </span>
                </div>
              </div>
            </div>

            {/* Preset swatches */}
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
                      setPrevColor(color); // store previous before switching
                      setColor(c);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-col gap-2">
              <button
                onClick={handleUndo}
                className="px-3 py-2 rounded-md bg-white border border-skrawl-purple/40 hover:bg-skrawl-white"
                title="Undo (⌘/Ctrl+Z)"
              >
                Undo
              </button>
              <button
                onClick={handleRedo}
                className="px-3 py-2 rounded-md bg-white border border-skrawl-purple/40 hover:bg-skrawl-white"
                title="Redo (Shift+⌘/Ctrl+Z)"
              >
                Redo
              </button>
              <button onClick={handleClear} className="px-3 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta" title="Clear canvas">
                Clear
              </button>
              <button onClick={handleSave} className="px-3 py-2 rounded-md bg-skrawl-purple text-white hover:bg-skrawl-magenta" title="Save PNG">
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
