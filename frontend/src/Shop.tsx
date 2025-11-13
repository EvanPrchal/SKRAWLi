import { useEffect, useMemo, useState } from "react";
import NavigationHeader from "./Components/NavigationHeader";
import { useApi } from "./lib/api";
import { useAuth0 } from "@auth0/auth0-react";

type Category = "Brushes" | "Themes" | "Characters" | "Misc";

type CatalogItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  colors?: string[]; // Optional color palette preview for themes
};

const CATALOG: CatalogItem[] = [
  // Brushes
  // { id: "pencil", name: "Pencil", description: "A simple pencil for sketching.", price: 0, category: "Brushes" },
  // { id: "marker", name: "Marker", description: "A vibrant marker for bold lines.", price: 50, category: "Brushes" },
  // { id: "chalk", name: "Chalk", description: "A soft chalk for textured drawings.", price: 75, category: "Brushes" },

  // Themes
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

  // Characters
  // { id: "ninja", name: "Ninja", description: "A stealthy ninja character.", price: 200, category: "Characters" },
  // { id: "robot", name: "Robot", description: "A futuristic robot character.", price: 300, category: "Characters" },

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

const Shop = () => {
  const { isLoading } = useAuth0();
  const api = useApi();
  const [activeTab, setActiveTab] = useState<Category>("Brushes");
  // Use null before data loads to avoid flashing 0
  const [coins, setCoins] = useState<number | null>(null);
  const [owned, setOwned] = useState<string[]>([]);

  // Load coins and owned items from backend on mount; use sessionStorage to mitigate flicker on reloads
  useEffect(() => {
    if (isLoading) return;

    const cachedCoins = sessionStorage.getItem("shop_coins");
    const cachedOwned = sessionStorage.getItem("shop_owned");
    if (cachedCoins) setCoins(Number(cachedCoins));
    if (cachedOwned) {
      try {
        setOwned(JSON.parse(cachedOwned));
      } catch {
        /* ignore parse errors */
      }
    }

    Promise.all([api.getCoins(), api.getOwnedItems()])
      .then(([coinsData, ownedData]) => {
        setCoins(coinsData.coins);
        sessionStorage.setItem("shop_coins", String(coinsData.coins));
        const ownedIds = ownedData.map((o) => o.item_id);
        setOwned(ownedIds);
        sessionStorage.setItem("shop_owned", JSON.stringify(ownedIds));
      })
      .catch((err) => console.error("Failed to load shop data:", err));
  }, [isLoading]);

  const items = useMemo(() => CATALOG.filter((i) => i.category === activeTab), [activeTab]);
  const isOwned = (id: string) => owned.includes(id);
  const canAfford = (price: number) => (coins ?? 0) >= price;

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

  return (
    <div className="min-h-screen bg-skrawl-black bg-cover">
      <NavigationHeader />
      <div className="flex">
        <section>
          <img src="/src/assets/images/pint2.png" alt="Shop side art" className="border-r-8  object-cover" />
        </section>

        <section className="shop-area flex-1 flex flex-col gap-6 p-6">
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
                    <td className="px-4 py-3 font-body">{item.price} coins</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Shop;
