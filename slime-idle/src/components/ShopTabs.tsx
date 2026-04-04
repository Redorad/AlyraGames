import { useState } from "react";
import { SKILLS } from "../data/skills";
import { SUBORDINATES } from "../data/subordinates";
import { BUILDINGS } from "../data/buildings";
import { ShopItem } from "./ShopItem";

const TABS = [
  { label: "⚔️ Skills", items: SKILLS },
  { label: "👥 Allies", items: SUBORDINATES },
  { label: "🏗️ Nation", items: BUILDINGS },
] as const;

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

      {/* Buy quantity selector */}
      <div className="flex items-center justify-end gap-1 px-3 pt-2">
        <span className="text-[10px] text-gray-500 mr-1">Buy:</span>
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

      <div className="flex-1 overflow-y-auto p-3 pt-2 space-y-2">
        {TABS[activeTab].items.map((item) => (
          <ShopItem key={item.id} item={item} buyQuantity={buyQty} />
        ))}
      </div>
    </div>
  );
}
