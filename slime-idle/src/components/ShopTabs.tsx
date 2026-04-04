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

export function ShopTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex border-b border-navy-700">
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-2 text-sm font-medium transition-colors
              ${
                activeTab === i
                  ? "text-steel border-b-2 border-steel"
                  : "text-gray-500 hover:text-gray-300"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {TABS[activeTab].items.map((item) => (
          <ShopItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
