import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ShopItemDef } from "../data/skills";
import { formatNumber } from "../utils/format";
import { BuyQuantity } from "./ShopTabs";

interface Props {
  item: ShopItemDef;
  buyQuantity: BuyQuantity;
}

export function ShopItem({ item, buyQuantity }: Props) {
  const [expanded, setExpanded] = useState(false);
  const magicules = useGameStore((s) => s.magicules);
  const owned = useGameStore((s) => s.ownedItems[item.id] ?? 0);
  const buyItem = useGameStore((s) => s.buyItem);
  const buyItemMultiple = useGameStore((s) => s.buyItemMultiple);
  const getItemCostForQuantity = useGameStore((s) => s.getItemCostForQuantity);
  const singleCost = useGameStore((s) => s.getItemCost(item));

  const qty = buyQuantity === "max" ? 1000 : buyQuantity;
  const { totalCost, affordable } = qty > 1
    ? getItemCostForQuantity(item, qty)
    : { totalCost: singleCost, affordable: magicules >= singleCost ? 1 : 0 };
  const displayCost = qty > 1 ? totalCost : singleCost;
  const canAfford = affordable > 0;
  const displayQty = buyQuantity === "max" ? affordable : Math.min(qty, affordable);

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (qty === 1) {
      buyItem(item);
    } else {
      buyItemMultiple(item, qty);
    }
  };

  // Tooltip data
  const totalClickIncome = (item.clickPower ?? 0) * owned;
  const totalPassiveIncome = (item.passivePower ?? 0) * owned;
  const nextClickGain = item.clickPower ?? 0;
  const nextPassiveGain = item.passivePower ?? 0;
  const efficiency = ((item.clickPower ?? 0) + (item.passivePower ?? 0)) / Math.max(1, singleCost);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`w-full rounded-lg border transition-all text-left cursor-pointer
        ${canAfford
          ? "border-steel/30 bg-navy-800/80 hover:bg-navy-700/80 hover:border-steel/60"
          : "border-gray-700/30 bg-navy-900/50 opacity-50"
        }`}
    >
      <div className="flex items-center gap-3 p-3">
        <span className="text-2xl flex-shrink-0">{item.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-white text-sm">{item.name}</span>
            {owned > 0 && (
              <span className="text-xs text-accent">Lv.{owned}</span>
            )}
          </div>
          <div className="text-xs text-gray-400 truncate">{item.description}</div>
        </div>
        <div className="text-right flex-shrink-0 flex items-center gap-2">
          <div>
            {displayQty > 1 && (
              <div className="text-[10px] text-gray-500 mb-0.5">×{displayQty}</div>
            )}
            <div className={`text-sm font-bold ${canAfford ? "text-steel" : "text-gray-500"}`}>
              🫧 {formatNumber(displayCost)}
            </div>
          </div>
          <button
            onClick={handleBuy}
            disabled={!canAfford}
            className={`px-2.5 py-1.5 rounded text-xs font-bold transition-colors
              ${canAfford
                ? "bg-steel/20 text-steel hover:bg-steel/30 active:scale-95"
                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
              }`}
          >
            Buy
          </button>
        </div>
      </div>
      {/* Expandable tooltip */}
      {expanded && owned > 0 && (
        <div className="px-3 pb-3 pt-0 border-t border-steel/10 mt-0">
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-gray-400 pt-2">
            {totalClickIncome > 0 && (
              <>
                <span>Total click income:</span>
                <span className="text-right text-steel">+{formatNumber(totalClickIncome)}/click</span>
              </>
            )}
            {totalPassiveIncome > 0 && (
              <>
                <span>Total passive income:</span>
                <span className="text-right text-steel">+{formatNumber(totalPassiveIncome)}/s</span>
              </>
            )}
            {nextClickGain > 0 && (
              <>
                <span>Next level click:</span>
                <span className="text-right text-accent">+{formatNumber(nextClickGain)}/click</span>
              </>
            )}
            {nextPassiveGain > 0 && (
              <>
                <span>Next level passive:</span>
                <span className="text-right text-accent">+{formatNumber(nextPassiveGain)}/s</span>
              </>
            )}
            <span>Efficiency:</span>
            <span className="text-right text-yellow-400">{efficiency.toExponential(2)} per 🫧</span>
          </div>
        </div>
      )}
    </div>
  );
}
