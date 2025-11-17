import { useEffect, useRef, useState } from "react";
import NavigationHeader from "./Components/NavigationHeader";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { useTheme } from "./lib/theme";

type SketchRef = any; // fallback to keep build smooth if type is missing

const FreeDraw = () => {
  const canvasRef = useRef<SketchRef>(null);
  const { theme } = useTheme();

  const [color, setColor] = useState<string>("#241f21");
  // Track the color before the most recent selection
  const [prevColor, setPrevColor] = useState<string>("#241f21");
  const [size, setSize] = useState<number>(6);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [presets, setPresets] = useState<string[]>(["#1C0667", "#E81E65", "#FF9F1C", "#2EC4B6", "#241f21", "#ffffff"]);

  // Sync erase mode with canvas
  useEffect(() => {
    if (canvasRef.current && typeof canvasRef.current.eraseMode === "function") {
      canvasRef.current.eraseMode(isEraser);
    }
  }, [isEraser]);

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

  return (
    <div className="min-h-screen bg-skrawl-black bg-[url('/src/assets/images/background.png')] bg-cover">
      <NavigationHeader />

      <div className="mx-auto max-w-7xl p-4 h-[calc(100vh-80px)]">
        <div className="w-full h-full flex gap-4">
          {/* Canvas area (left) */}
          <div className="flex-1 bg-skrawl-white rounded-md border border-skrawl-purple/20 overflow-hidden flex">
            <ReactSketchCanvas
              ref={canvasRef}
              style={{ flex: 1, minHeight: 0 }}
              width="100%"
              height="100%"
              strokeWidth={size}
              strokeColor={isEraser ? "#ffffff" : color}
              canvasColor="#ffffff"
              withTimestamp={false}
              eraserWidth={size}
            />
          </div>

          {/* Sidebar toolbar (right) */}
          <aside className="w-72 bg-skrawl-white rounded-md border border-skrawl-purple/20 p-4 flex flex-col gap-4">
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
                  disabled={isEraser}
                  className="w-10 h-10 p-1 rounded cursor-pointer border border-gray-300 disabled:opacity-60"
                  title="Pick stroke color"
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
                    className="w-6 h-6 rounded-full border border-gray-300 shadow-sm hover:ring-2 hover:ring-skrawl-cyan focus:outline-none"
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
                    disabled={isEraser}
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
