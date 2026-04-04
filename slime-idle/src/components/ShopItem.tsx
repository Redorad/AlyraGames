import { useGameStore } from "../store/gameStore";
import { ShopItemDef } from "../data/skills";
import { formatNumber } from "../utils/format";
import { BuyQuantity } from "./ShopTabs";

interface Props {
  item: ShopItemDef;
  buyQuantity: BuyQuantity;
}

export function ShopItem({ item, buyQuantity }: Props) {
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

  const handleBuy = () => {
    if (qty === 1) {
      buyItem(item);
    } else {
      buyItemMultiple(item, qty);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={!canAfford}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
        ${canAfford
          ? "border-steel/30 bg-navy-800/80 hover:bg-navy-700/80 hover:border-steel/60 active:scale-[0.98]"
          : "border-gray-700/30 bg-navy-900/50 opacity-50 cursor-not-allowed"
        }`}
    >
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
      <div className="text-right flex-shrink-0">
        {displayQty > 1 && (
          <div className="text-[10px] text-gray-500 mb-0.5">×{displayQty}</div>
        )}
        <div className={`text-sm font-bold ${canAfford ? "text-steel" : "text-gray-500"}`}>
          🫧 {formatNumber(displayCost)}
        </div>
      </div>
    </button>
  );
}
