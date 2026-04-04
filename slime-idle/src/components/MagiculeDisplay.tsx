import { useGameStore } from "../store/gameStore";
import { formatNumber } from "../utils/format";
import { AnimatedNumber } from "./AnimatedNumber";

export function MagiculeDisplay() {
  const magicules = useGameStore((s) => s.magicules);
  const clickPower = useGameStore((s) => s.getClickPower());
  const passivePower = useGameStore((s) => s.getPassivePower());
  const stormActive = useGameStore((s) => s.stormActive);
  const stormMultiplier = useGameStore((s) => s.stormMultiplier);
  const autoBuyEnabled = useGameStore((s) => s.autoBuyEnabled);
  const toggleAutoBuy = useGameStore((s) => s.toggleAutoBuy);
  const critChance = useGameStore((s) => s.getCritChance());

  return (
    <div className="text-center py-2">
      <div className={`text-3xl font-bold ${stormActive ? "text-yellow-300" : "text-steel"}`}>
        <AnimatedNumber value={magicules} prefix="🫧 " />
      </div>
      <div className="text-sm text-gray-400 mt-1 flex justify-center gap-4">
        <AnimatedNumber value={clickPower} className="text-gray-400" prefix="" /><span>/click</span>
        <AnimatedNumber value={passivePower} className="text-gray-400" prefix="" /><span>/s</span>
      </div>
      {stormActive && (
        <div className="text-xs text-yellow-400 mt-0.5 animate-pulse">
          🌀 Storm ×{stormMultiplier} active!
        </div>
      )}
      <div className="flex items-center justify-center gap-3 mt-1">
        {critChance > 0 && (
          <span className="text-[10px] text-yellow-500">{Math.round(critChance * 100)}% crit</span>
        )}
        <button
          onClick={toggleAutoBuy}
          className={`text-[10px] px-2 py-0.5 rounded transition-colors
            ${autoBuyEnabled
              ? "bg-green-900/30 text-green-400 border border-green-600/40"
              : "text-gray-600 border border-gray-700/40 hover:text-gray-400"
            }`}
        >
          {autoBuyEnabled ? "🤖 Auto-buy ON" : "🤖 Auto-buy"}
        </button>
      </div>
    </div>
  );
}
