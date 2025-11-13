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
};

const CATALOG: CatalogItem[] = [];

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
                  <th className="px-4 py-3 font-header">Price</th>
                  <th className="px-4 py-3 font-header text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-white/80"} text-skrawl-purple`}>
                    <td className="px-4 py-3 font-body">{item.name}</td>
                    <td className="px-4 py-3 font-body text-skrawl-purple/80">{item.description}</td>
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
