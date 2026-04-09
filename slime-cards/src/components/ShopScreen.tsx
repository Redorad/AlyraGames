import { useGameStore } from "../store/gameStore";
import * as sfx from "../utils/sounds";

export default function ShopScreen() {
  const player = useGameStore((s) => s.player);
  const combatReward = useGameStore((s) => s.combatReward);
  const goToMap = useGameStore((s) => s.goToMap);
  const pickRewardCard = useGameStore((s) => s.pickRewardCard);

  if (!combatReward) return null;

  const buyCard = (cardId: string, cost: number) => {
    if (player.gold < cost) return;
    useGameStore.setState({ player: { ...player, gold: player.gold - cost } });
    sfx.playGold();
    pickRewardCard(cardId);
  };

  const buyHeal = () => {
    if (player.gold < 30) return;
    sfx.playHeal();
    useGameStore.setState({
      player: { ...player, gold: player.gold - 30, hp: Math.min(player.maxHp, player.hp + 15) },
    });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-navy-900 px-4">
      <div className="text-center slide-up">
        <div className="text-5xl mb-4">{"\u{1F6D2}"}</div>
        <h2 className="text-xl font-bold text-blue-400 mb-1">Shop</h2>
        <p className="text-yellow-400 text-sm mb-6">{player.gold} gold available</p>

        <div className="flex gap-3 flex-wrap justify-center mb-4">
          {combatReward.cardChoices.map((def) => {
            const cost = def.rarity === "rare" ? 80 : def.rarity === "uncommon" ? 50 : 30;
            const canBuy = player.gold >= cost;
            return (
              <button
                key={def.id}
                onClick={() => canBuy && buyCard(def.id, cost)}
                className={`w-[110px] rounded-xl border-2 p-2.5 transition-all flex flex-col items-center text-center
                  ${canBuy ? "border-white/20 bg-navy-700/80 hover:scale-105 cursor-pointer" : "border-gray-700/30 bg-navy-900/50 opacity-40 cursor-not-allowed"}`}
              >
                <div className="text-2xl mb-1">{def.emoji}</div>
                <div className="text-xs font-bold" style={{ color: def.color }}>{def.name}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{def.description}</div>
                <div className="text-yellow-400 text-xs font-bold mt-1">{cost}G</div>
              </button>
            );
          })}
        </div>

        {/* Heal option */}
        <button
          onClick={buyHeal}
          disabled={player.gold < 30}
          className={`px-4 py-2 rounded-lg text-sm mb-4 ${player.gold >= 30 ? "bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30" : "bg-gray-700/30 text-gray-500 border border-gray-600/20 cursor-not-allowed"}`}
        >
          {"\u{2764}\u{FE0F}"} Heal +15 HP (30G)
        </button>

        <div>
          <button
            onClick={goToMap}
            className="text-gray-500 text-sm hover:text-gray-300 transition"
          >
            Leave Shop
          </button>
        </div>
      </div>
    </div>
  );
}
