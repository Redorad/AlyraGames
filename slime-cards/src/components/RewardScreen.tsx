import { useGameStore } from "../store/gameStore";
import { CARDS } from "../data/cards";

export default function RewardScreen() {
  const combatReward = useGameStore((s) => s.combatReward);
  const pickRewardCard = useGameStore((s) => s.pickRewardCard);
  const skipReward = useGameStore((s) => s.skipReward);

  if (!combatReward) return null;

  return (
    <div className="h-full flex flex-col items-center justify-center bg-navy-900 px-4">
      <div className="text-4xl mb-3">{"\u{1F389}"}</div>
      <h2 className="text-xl font-bold text-green-400 mb-1">Victory!</h2>
      <p className="text-yellow-400 text-sm mb-6">+{combatReward.gold} gold</p>

      <p className="text-gray-400 text-sm mb-4">Choose a card to add to your deck:</p>

      <div className="flex gap-3 flex-wrap justify-center mb-6">
        {combatReward.cardChoices.map((def) => {
          const rarityBorder = def.rarity === "rare" ? "border-yellow-500/60" : def.rarity === "uncommon" ? "border-blue-400/60" : "border-white/20";
          return (
            <button
              key={def.id}
              onClick={() => pickRewardCard(def.id)}
              className={`w-[120px] rounded-xl border-2 p-3 transition-all flex flex-col items-center text-center
                ${rarityBorder} bg-navy-700/80 hover:scale-105 hover:border-white/50 cursor-pointer`}
            >
              <div className="w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center mb-1">
                {def.cost}
              </div>
              <div className="text-3xl mb-1">{def.emoji}</div>
              <div className="text-sm font-bold" style={{ color: def.color }}>{def.name}</div>
              <div className="text-[10px] text-gray-400 leading-snug mt-1">{def.description}</div>
              <div className="mt-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full
                  ${def.rarity === "rare" ? "bg-yellow-500/20 text-yellow-400" : def.rarity === "uncommon" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>
                  {def.rarity === "rare" ? "Rare" : def.rarity === "uncommon" ? "Uncommon" : "Common"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={skipReward}
        className="text-gray-500 text-sm hover:text-gray-300 transition"
      >
        Skip
      </button>
    </div>
  );
}
