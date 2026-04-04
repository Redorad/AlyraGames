import { useState, useMemo } from "react";
import { SKILLS, ShopItemDef } from "../data/skills";
import { SUBORDINATES } from "../data/subordinates";
import { BUILDINGS } from "../data/buildings";
import { ShopItem } from "./ShopItem";
import { useGameStore } from "../store/gameStore";

const TABS = [
  { label: "⚔️ Skills", items: SKILLS },
  { label: "👥 Allies", items: SUBORDINATES },
  { label: "🏗️ Nation", items: BUILDINGS },
] as const;

type SortMode = "default" | "cost" | "owned" | "efficiency";
const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: "Default", value: "default" },
  { label: "Cost", value: "cost" },
  { label: "Owned", value: "owned" },
  { label: "Value", value: "efficiency" },
];

export type BuyQuantity = 1 | 10 | 25 | "max";
const QUANTITIES: { label: string; value: BuyQuantity }[] = [
  { label: "×1", value: 1 },
  { label: "×10", value: 10 },
  { label: "×25", value: 25 },
  { label: "Max", value: "max" },
];

export function ShopTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const [buyQty, setBuyQty] = useState<BuyQuantity>(1);
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const ownedItems = useGameStore((s) => s.ownedItems);
  const getItemCost = useGameStore((s) => s.getItemCost);

  const sortedItems = useMemo(() => {
    const items = [...TABS[activeTab].items] as ShopItemDef[];
    if (sortMode === "default") return items;
    if (sortMode === "cost") return items.sort((a, b) => getItemCost(a) - getItemCost(b));
    if (sortMode === "owned") return items.sort((a, b) => (ownedItems[b.id] ?? 0) - (ownedItems[a.id] ?? 0));
    if (sortMode === "efficiency") {
      return items.sort((a, b) => {
        const valA = ((a.clickPower ?? 0) + (a.passivePower ?? 0)) / Math.max(1, getItemCost(a));
        const valB = ((b.clickPower ?? 0) + (b.passivePower ?? 0)) / Math.max(1, getItemCost(b));
        return valB - valA;
      });
    }
    return items;
  }, [activeTab, sortMode, ownedItems, getItemCost]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex border-b border-navy-700">
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-2 text-sm font-medium transition-colors
              ${activeTab === i
                ? "text-steel border-b-2 border-steel"
                : "text-gray-500 hover:text-gray-300"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Buy quantity + sort selectors */}
      <div className="flex items-center justify-between gap-1 px-3 pt-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500 mr-0.5">Sort:</span>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSortMode(s.value)}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors
                ${sortMode === s.value
                  ? "bg-accent/20 text-accent border border-accent/40"
                  : "text-gray-600 hover:text-gray-400 border border-transparent"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500 mr-0.5">Buy:</span>
          {QUANTITIES.map((q) => (
            <button
              key={q.label}
              onClick={() => setBuyQty(q.value)}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors
                ${buyQty === q.value
                  ? "bg-steel/20 text-steel border border-steel/40"
                  : "text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 pt-2 space-y-2">
        {sortedItems.map((item) => (
          <ShopItem key={item.id} item={item} buyQuantity={buyQty} />
        ))}
      </div>
    </div>
  );
}
