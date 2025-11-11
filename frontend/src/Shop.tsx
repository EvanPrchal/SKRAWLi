import { useEffect, useMemo, useState } from "react";
import NavigationHeader from "./Components/NavigationHeader";

type Category = "Brushes" | "Themes" | "Avatars";

type CatalogItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
};

const CATALOG: CatalogItem[] = [
  { id: "brush-1", name: "Pencil Brush", description: "A light pencil-like stroke.", price: 50, category: "Brushes" },
  { id: "brush-2", name: "Ink Brush", description: "Sharp inky lines for confident strokes.", price: 120, category: "Brushes" },
  { id: "theme-1", name: "Neon Theme", description: "Glow up your UI with neon accents.", price: 200, category: "Themes" },
  { id: "theme-2", name: "Monochrome Theme", description: "Minimal high-contrast theme.", price: 150, category: "Themes" },
  { id: "avatar-1", name: "Skrawly", description: "A playful new avatar style.", price: 300, category: "Avatars" },
  { id: "avatar-2", name: "Vector", description: "Sleek geometric avatar.", price: 260, category: "Avatars" },
];

const TABS: Category[] = ["Brushes", "Themes", "Avatars"];

const Shop = () => {
  const [activeTab, setActiveTab] = useState<Category>("Brushes");
  const [owned, setOwned] = useState<string[]>(() => {
    const raw = localStorage.getItem("ownedItems");
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("ownedItems", JSON.stringify(owned));
  }, [owned]);

  const items = useMemo(() => CATALOG.filter((i) => i.category === activeTab), [activeTab]);
  const isOwned = (id: string) => owned.includes(id);

  const handleBuy = (item: CatalogItem) => {
    if (isOwned(item.id)) return;
    setOwned((prev) => [...prev, item.id]);
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
                          disabled={isOwned(item.id)}
                          className={`py-2 px-4 rounded-md font-body transition-colors ${
                            isOwned(item.id) ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-skrawl-purple text-white hover:bg-skrawl-magenta"
                          }`}
                        >
                          {isOwned(item.id) ? "Owned" : "Buy"}
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
