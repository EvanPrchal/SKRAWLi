import { useEffect, useMemo, useRef, useState } from "react";
import NavigationHeader from "./Components/NavigationHeader";
import Loading from "./Components/Loading";
import { useDataReady } from "./lib/useDataReady";
import { useApi } from "./lib/api";
import { useTheme } from "./lib/theme";
import { useAuth0 } from "@auth0/auth0-react";

type Category = "Brushes" | "Themes" | "Characters" | "Misc";

type CatalogItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  colors?: string[]; // Optional color palette preview for themes
  preview?: string; // Optional preview type (e.g., "pixel")
  previewImage?: string; // Optional image preview
};

const CATALOG: CatalogItem[] = [
  // Brushes
  {
    id: "default-brush",
    name: "Brush",
    description: "The default brush",
    price: 0,
    category: "Brushes",
  },
  {
    id: "pixel-brush",
    name: "Pixel Brush",
    description: "A brush that instead draws pixel blocks",
    price: 100,
    category: "Brushes",
    preview: "pixel",
  },
  {
    id: "rainbow-brush",
    name: "Rainbow Brush",
    description: "Fruity :)",
    price: 200,
    category: "Brushes",
    preview: "rainbow",
  },

  // Characters
  {
    id: "splotch",
    name: "Splotch",
    description: "The default skrawli avatar (he's just a little guy)",
    price: 0,
    category: "Characters",
    previewImage: "/src/assets/svgs/splotch_neutral.png",
  },

  // Themes
  {
    id: "default-theme",
    name: "Default Theme",
    description: "Default skrawli theme",
    price: 0,
    category: "Themes",
    colors: ["#1C0667", "#E81E65", "#FF9F1C", "#2EC4B6", "#241f21"],
  },
  {
    id: "coffee-theme",
    name: "Coffee Theme",
    description: "A cozy coffee inspired theme",
    price: 250,
    category: "Themes",
    colors: ["#7f5539", "#ddb892", "#e6ccb2", "#b08968", "#ede0d4"],
  },
  {
    id: "pastel-theme",
    name: "Pastel Theme",
    description: "Pastel theme for all the dreamers",
    price: 250,
    category: "Themes",
    colors: ["#9c89b8", "#f0a6ca", "#efc3e6", "#f0e6ef", "#b8bedd"],
  },
  {
    id: "rose-theme",
    name: "Rose Theme",
    description: "For those with a more refined taste",
    price: 250,
    category: "Themes",
    colors: ["#880d1e", "#dd2d4a", "#f26a8d", "#f49cbb", "#cbeef3"],
  },

  // Misc
  {
    id: "color-picker",
    name: "Color Picker",
    description: "Unlocks full color customization for the profile background",
    price: 300,
    category: "Misc",
  },
];

const TABS: Category[] = ["Brushes", "Themes", "Characters", "Misc"];

// Map each brush catalog id to a unique internal style identifier used by canvases.
// Non-pixel styles currently render with the smooth brush implementation.
const BRUSH_STYLE_MAP: Record<string, string> = {
  "smooth-brush": "smooth",
  "pixel-brush": "pixel",
  "rainbow-brush": "rainbow",
};

const BrushPreview = ({ variant }: { variant: "pixel" | "rainbow" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 84;
    const height = 34;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pathPoints = [
      { x: 12, y: 22 },
      { x: 24, y: 16 },
      { x: 36, y: 12 },
      { x: 48, y: 16 },
      { x: 60, y: 24 },
      { x: 72, y: 20 },
    ];

    if (variant === "pixel") {
      ctx.fillStyle = "#241f21";
      const size = 10;
      const stepDist = size * 0.6;

      const drawBlock = (x: number, y: number) => {
        ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
      };

      let prevPoint = pathPoints[0];
      drawBlock(prevPoint.x, prevPoint.y);

      for (let i = 1; i < pathPoints.length; i++) {
        const current = pathPoints[i];
        const dx = current.x - prevPoint.x;
        const dy = current.y - prevPoint.y;
        const distance = Math.hypot(dx, dy);
        const segments = Math.max(1, Math.floor(distance / stepDist));
        for (let seg = 1; seg <= segments; seg++) {
          const t = seg / segments;
          const ix = prevPoint.x + dx * t;
          const iy = prevPoint.y + dy * t;
          drawBlock(ix, iy);
        }
        prevPoint = current;
      }
    } else {
      const size = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = size;

      let prevPoint = pathPoints[0];
      let hue = 0; // start at red to mirror in-app brush

      for (let i = 1; i < pathPoints.length; i++) {
        const current = pathPoints[i];
        const dx = current.x - prevPoint.x;
        const dy = current.y - prevPoint.y;
        const distance = Math.hypot(dx, dy);
        const step = 6;
        const segments = Math.max(1, Math.floor(distance / step));

        for (let seg = 0; seg < segments; seg++) {
          const startT = seg / segments;
          const endT = (seg + 1) / segments;
          const startX = prevPoint.x + dx * startT;
          const startY = prevPoint.y + dy * startT;
          const endX = prevPoint.x + dx * endT;
          const endY = prevPoint.y + dy * endT;

          ctx.strokeStyle = `hsl(${hue % 360}, 100%, 50%)`;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          hue += 12;
        }

        prevPoint = current;
      }
    }
  }, [variant]);

  return <canvas ref={canvasRef} className="block rounded-md border border-gray-300 bg-white" />;
};

const Shop = () => {
  const { isLoading, isAuthenticated } = useAuth0();
  const api = useApi();
  const { theme, setTheme, ownedThemes } = useTheme();
  const [activeTab, setActiveTab] = useState<Category>("Brushes");
  // Use null before data loads to avoid flashing 0
  const [coins, setCoins] = useState<number | null>(null);
  const [owned, setOwned] = useState<string[]>([]);
  const [coinsLoaded, setCoinsLoaded] = useState<boolean>(false);
  const [ownedLoaded, setOwnedLoaded] = useState<boolean>(false);
  const [equippedBrush, setEquippedBrush] = useState<string>(() => {
    if (typeof window === "undefined") return "smooth";
    return localStorage.getItem("equippedBrush") || "smooth";
  });
  const [equippedCharacter, setEquippedCharacter] = useState<string>(() => {
    if (typeof window === "undefined") return "/src/assets/svgs/splotch_neutral.png";
    const saved = localStorage.getItem("equippedCharacter");
    if (!saved) {
      localStorage.setItem("equippedCharacter", "/src/assets/svgs/splotch_neutral.png");
      return "/src/assets/svgs/splotch_neutral.png";
    }
    return saved;
  });

  // Save equipped brush to localStorage and dispatch event
  useEffect(() => {
    localStorage.setItem("equippedBrush", equippedBrush);
    window.dispatchEvent(new Event("brushUpdate"));
  }, [equippedBrush]);

  useEffect(() => {
    localStorage.setItem("equippedCharacter", equippedCharacter);
  }, [equippedCharacter]);

  // Load coins and owned items from backend on mount; use sessionStorage to mitigate flicker on reloads
  const fetchedBackendRef = useRef<boolean>(false);
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    // Read cache once
    if (!fetchedBackendRef.current) {
      const cachedCoins = sessionStorage.getItem("shop_coins");
      const cachedOwned = sessionStorage.getItem("shop_owned");
      if (cachedCoins) {
        setCoins(Number(cachedCoins));
        setCoinsLoaded(true);
      }
      if (cachedOwned) {
        try {
          setOwned(JSON.parse(cachedOwned));
          setOwnedLoaded(true);
        } catch {
          /* ignore */
        }
      }
    }
    // Avoid refetch loop by guarding with ref
    if (fetchedBackendRef.current) return;
    fetchedBackendRef.current = true;
    Promise.all([api.getCoins(), api.getOwnedItems()])
      .then(([coinsData, ownedData]) => {
        setCoins(coinsData.coins);
        setCoinsLoaded(true);
        sessionStorage.setItem("shop_coins", String(coinsData.coins));
        const ownedIds = ownedData.map((o) => o.item_id);
        setOwned(ownedIds);
        setOwnedLoaded(true);
        sessionStorage.setItem("shop_owned", JSON.stringify(ownedIds));
      })
      .catch((err) => console.error("Failed to load shop data:", err));
  }, [isLoading, isAuthenticated]);

  const items = useMemo(() => CATALOG.filter((i) => i.category === activeTab), [activeTab]);
  const isOwned = (id: string) => id === "smooth-brush" || id === "default-theme" || id === "classic-pint" || id === "splotch" || owned.includes(id);
  const canAfford = (price: number) => (coins ?? 0) >= price;

  const ready = useDataReady([
    !isLoading,
    !isAuthenticated || (coinsLoaded && ownedLoaded), // if authenticated require data; guests skip
  ]);
  if (!ready) return <Loading />;

  const handleEquipBrush = (itemId: string) => {
    const styleId = BRUSH_STYLE_MAP[itemId] || itemId; // fallback to itemId for future styles
    setEquippedBrush(styleId);
  };
  const handleEquipCharacter = (item: CatalogItem) => {
    if (!item.previewImage) return;
    setEquippedCharacter(item.previewImage);
  };

  const handleBuy = async (item: CatalogItem) => {
    if (isOwned(item.id) || !canAfford(item.price)) return;

    try {
      // Deduct coins from backend
      const result = await api.incrementCoins(-item.price);
      await api.addOwnedItem(item.id);
      setCoins(result.coins);
      setOwned((prev) => {
        const updated = [...prev, item.id];
        sessionStorage.setItem("shop_coins", String(result.coins));
        sessionStorage.setItem("shop_owned", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Failed to purchase item:", err);
      alert("Purchase failed. Please try again.");
    }
  };

  // Map catalog theme item id to ThemeProvider theme key
  const themeIdMap: Record<string, string> = {
    "default-theme": "default",
    "coffee-theme": "coffee",
    "pastel-theme": "cotton-candy",
    "cotton-candy-theme": "cotton-candy",
    "rose-theme": "rose",
  };

  const handleEquipTheme = (itemId: string) => {
    const mapped = themeIdMap[itemId];
    if (!mapped) return;
    // Ensure user actually owns the theme per provider's ownedThemes list
    if (!ownedThemes.includes(mapped as any)) return;
    setTheme(mapped as any);
  };

  return (
    <div className="min-h-screen bg-skrawl-orange bg-[url('/src/assets/images/background.png')] bg-cover flex flex-col">
      <NavigationHeader />
      {!isAuthenticated ? (
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center bg-skrawl-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-logotype font-logotype text-skrawl-purple mb-4">Shop Closed</h1>
            <p className="text-body font-body text-skrawl-purple mb-6">Please sign in to access the shop.</p>
            <a href="/" className="text-body font-body text-skrawl-purple hover:text-skrawl-magenta underline">
              Back to Home
            </a>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-[calc(100vh-80px)] w-full">
          <section className="basis-1/3  bg-cover bg-center bg-blend-multiply text-skrawl-white flex-shrink-0 flex flex-col items-center justify-center py-10 self-stretch px-6">
            <section className="bg-skrawl-white p-6 rounded-2xl m-6">
              <section>
                <img src="/src/assets/svgs/splotch_neutral.png" alt="Shop side art" className="object-contain h-[500px]" />
                <div className="bg-skrawl-white text-skrawl-magenta font-header text-header text-center p-2  rounded-lg shadow-lg border-4 border-skrawl-purple">
                  Welcome to the Shop!
                </div>
              </section>
            </section>
          </section>

          <section className="shop-area  bg-cover bg-center bg-blend-multiply flex-[2] flex flex-col gap-6 p-6 self-stretch text-skrawl-white">
            <header className="flex items-center justify-between">
              <h1 className="text-logotype font-logotype text-skrawl-white">Shop</h1>
              <div className="text-header font-header text-skrawl-purple bg-skrawl-white rounded-2xl px-2 flex items-center gap-2">
                <img src="/src/assets/svgs/coin.png" alt="Coins" className="h-8 w-8 object-contain" />
                {coins === null ? <span className="text-accent-cyan/60">Loading...</span> : <span className="text-accent-cyan">{coins}</span>}
              </div>
            </header>

            {/* Tabs */}
            <div className="flex items-center gap-2">
              {TABS.map((tab) => {
                const active = tab === activeTab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-md font-header transition-colors border ${
                      active ? "bg-skrawl-purple text-white border-skrawl-purple" : "bg-white/10 text-skrawl-white border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-white/20 bg-skrawl-white/95">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-skrawl-purple/80">
                    <th className="px-4 py-3 font-header">Name</th>
                    <th className="px-4 py-3 font-header">Description</th>
                    <th className="px-4 py-3 font-header">Preview</th>
                    <th className="px-4 py-3 font-header">Price</th>
                    <th className="px-4 py-3 font-header text-right">Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-white/80"} text-skrawl-purple`}>
                      <td className="px-4 py-3 font-body">{item.name}</td>
                      <td className="px-4 py-3 font-body text-skrawl-purple/80">{item.description}</td>
                      <td className="px-4 py-3">
                        {item.colors ? (
                          <div className="flex gap-1">
                            {item.colors.map((color, i) => (
                              <div key={i} className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: color }} title={color} />
                            ))}
                          </div>
                        ) : item.preview === "pixel" ? (
                          <BrushPreview variant="pixel" />
                        ) : item.preview === "rainbow" ? (
                          <BrushPreview variant="rainbow" />
                        ) : item.previewImage ? (
                          <div className="w-16 h-16 rounded-md overflow-hidden border border-gray-300 bg-white flex items-center justify-center">
                            <img src={item.previewImage} alt={`${item.name} preview`} className="w-full h-full object-contain" />
                          </div>
                        ) : item.id === "color-picker" ? (
                          <div
                            className="w-7 h-7 rounded-full border border-gray-300 shadow-sm"
                            title="Color Picker"
                            style={{
                              background: "conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                            }}
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body">
                        {item.price === 0 &&
                        (item.id === "smooth-brush" || item.id === "default-theme" || item.id === "classic-pint" || item.id === "splotch")
                          ? "-"
                          : `${item.price} coins`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {isOwned(item.id) && item.category === "Brushes" ? (
                            (() => {
                              const brushStyle = BRUSH_STYLE_MAP[item.id] || item.id;
                              const isEquipped = equippedBrush === brushStyle;
                              return (
                                <button
                                  onClick={() => handleEquipBrush(item.id)}
                                  className={`py-2 px-4 rounded-md font-body transition-colors ${
                                    isEquipped ? "bg-skrawl-magenta text-white" : "bg-skrawl-purple text-white hover:bg-skrawl-magenta"
                                  }`}
                                >
                                  {isEquipped ? "✓ Equipped" : "Equip"}
                                </button>
                              );
                            })()
                          ) : isOwned(item.id) && item.category === "Themes" ? (
                            (() => {
                              const mapped = themeIdMap[item.id];
                              const isEquipped = mapped === theme;
                              return (
                                <button
                                  onClick={() => handleEquipTheme(item.id)}
                                  className={`py-2 px-4 rounded-md font-body transition-colors ${
                                    isEquipped ? "bg-skrawl-magenta text-white" : "bg-skrawl-purple text-white hover:bg-skrawl-magenta"
                                  }`}
                                >
                                  {isEquipped ? "✓ Equipped" : "Equip"}
                                </button>
                              );
                            })()
                          ) : isOwned(item.id) && item.category === "Characters" ? (
                            (() => {
                              const isEquipped = equippedCharacter === item.previewImage;
                              return (
                                <button
                                  onClick={() => handleEquipCharacter(item)}
                                  className={`py-2 px-4 rounded-md font-body transition-colors ${
                                    isEquipped ? "bg-skrawl-magenta text-white" : "bg-skrawl-purple text-white hover:bg-skrawl-magenta"
                                  }`}
                                >
                                  {isEquipped ? "✓ Equipped" : "Equip"}
                                </button>
                              );
                            })()
                          ) : (
                            <button
                              onClick={() => handleBuy(item)}
                              disabled={isOwned(item.id) || !canAfford(item.price)}
                              className={`py-2 px-4 rounded-md font-body transition-colors ${
                                isOwned(item.id)
                                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                  : canAfford(item.price)
                                  ? "bg-skrawl-purple text-white hover:bg-skrawl-magenta"
                                  : "bg-gray-500/40 text-white/70 cursor-not-allowed"
                              }`}
                            >
                              {isOwned(item.id) ? "Owned" : canAfford(item.price) ? "Buy" : "Not enough coins"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Shop;
