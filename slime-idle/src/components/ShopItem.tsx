import { useGameStore } from "../store/gameStore";
import { ShopItemDef } from "../data/skills";
import { formatNumber } from "../utils/format";

interface Props {
  item: ShopItemDef;
}

export function ShopItem({ item }: Props) {
  const magicules = useGameStore((s) => s.magicules);
  const owned = useGameStore((s) => s.ownedItems[item.id] ?? 0);
  const buyItem = useGameStore((s) => s.buyItem);
  const cost = useGameStore((s) => s.getItemCost(item));
  const canAfford = magicules >= cost;

  return (
    <button
      onClick={() => buyItem(item)}
      disabled={!canAfford}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
        ${
          canAfford
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
        <div className={`text-sm font-bold ${canAfford ? "text-steel" : "text-gray-500"}`}>
          🫧 {formatNumber(cost)}
        </div>
      </div>
    </button>
  );
}
