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
    id: "smooth-brush",
    name: "Smooth Brush",
    description: "Default smooth drawing brush.",
    price: 0,
    category: "Brushes",
  },
  {
    id: "pixel-brush",
    name: "Pixel Brush",
    description: "Draw with a retro pixelated brush for blocky, digital art.",
    price: 120,
    category: "Brushes",
    preview: "pixel",
  },
  {
    id: "rainbow-brush",
    name: "Rainbow Brush",
    description: "Paint with all the colors of the rainbow in a single stroke.",
    price: 200,
    category: "Brushes",
    preview: "rainbow",
  },

  // Characters
  {
    id: "classic-pint",
    name: "Classic Pint",
    description: "The default SKRAWLi companion, ready to skrawl!",
    price: 0,
    category: "Characters",
    previewImage: "/src/assets/images/pint2.png",
  },

  // Themes
  {
    id: "default-theme",
    name: "Default Theme",
    description: "Base SKRAWLi theme (always available).",
    price: 0,
    category: "Themes",
    colors: ["#1C0667", "#E81E65", "#FF9F1C", "#2EC4B6", "#241f21"],
  },
  {
    id: "coffee-theme",
    name: "Coffee Theme",
    description: "Warm brown and cream tones for a cozy vibe.",
    price: 250,
    category: "Themes",
    colors: ["#7f5539", "#ddb892", "#e6ccb2", "#b08968", "#ede0d4"],
  },
  {
    id: "cotton-candy-theme",
    name: "Cotton Candy Theme",
    description: "Soft pastel colors for a sweet look.",
    price: 250,
    category: "Themes",
    colors: ["#8093f1", "#72ddf7", "#f7aef8", "#b388eb", "#f4f4ed"],
  },
  {
    id: "rose-theme",
    name: "Rose Theme",
    description: "Romantic pink and red tones for an elegant look.",
    price: 250,
    category: "Themes",
    colors: ["#880d1e", "#dd2d4a", "#f26a8d", "#f49cbb", "#cbeef3"],
  },

  // Misc
  {
    id: "color-picker",
    name: "Color Picker",
    description: "Unlock full color wheel for profile backgrounds.",
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
    if (typeof window === "undefined") return "/src/assets/images/pint2.png";
    return localStorage.getItem("equippedCharacter") || "/src/assets/images/pint2.png";
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
  const isOwned = (id: string) => id === "smooth-brush" || id === "default-theme" || id === "classic-pint" || owned.includes(id);
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
    <div className="min-h-screen bg-skrawl-black bg-cover">
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
        <div className="flex">
          <section className="bg-skrawl-purple flex flex-col items-center justify-around h-full">
            <img src="/src/assets/images/pint2.png" alt="Shop side art" className="border-r-8 object-cover h-200" />
            <div className="bg-skrawl-white text-skrawl-purple font-header text-header px-6 py-4 rounded-lg shadow-lg border-4 border-skrawl-purple">
              Welcome to the Shop!
            </div>
          </section>

          <section className="shop-area bg-skrawl-orange bg-[url('/src/assets/images/background.png')] bg-cover flex-1 flex flex-col gap-6 p-6">
            <header className="flex items-center justify-between">
              <h1 className="text-logotype font-logotype text-skrawl-white">Shop</h1>
              <div className="text-header font-header text-skrawl-white">
                {coins === null ? (
                  <span className="text-accent-cyan/60">Loading...</span>
                ) : (
                  <>
                    Coins: <span className="text-accent-cyan">{coins}</span>
                  </>
                )}
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
                          <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div key={i} className="w-2 h-2 bg-skrawl-black border border-gray-300" />
                            ))}
                          </div>
                        ) : item.preview === "rainbow" ? (
                          <div className="w-16 h-8 rounded-full border border-gray-300 overflow-hidden bg-white">
                            <div
                              className="h-full w-full"
                              style={{ background: "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)" }}
                            />
                          </div>
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
                        {item.price === 0 && (item.id === "smooth-brush" || item.id === "default-theme" || item.id === "classic-pint")
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
