import { useGameStore } from "../store/gameStore";

export default function RestScreen() {
  const player = useGameStore((s) => s.player);
  const rest = useGameStore((s) => s.rest);
  const goToMap = useGameStore((s) => s.goToMap);

  const healAmount = Math.round(player.maxHp * 0.3);
  const newHp = Math.min(player.maxHp, player.hp + healAmount);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-navy-900 px-4">
      <div className="text-center slide-up">
        <div className="text-5xl mb-4">{"\u{1F525}"}</div>
        <h2 className="text-xl font-bold text-orange-400 mb-2">Campfire</h2>
        <p className="text-gray-400 text-sm mb-6">You rest by the fire...</p>

        <div className="mb-4 text-sm text-gray-300">
          HP: {player.hp}/{player.maxHp}
        </div>

        <div className="space-y-3">
          <button
            onClick={rest}
            className="w-full max-w-xs px-6 py-3 rounded-xl bg-green-500/20 text-green-300 border border-green-500/40 font-bold hover:bg-green-500/30 transition"
          >
            {"\u{2764}\u{FE0F}"} Rest (+{healAmount} HP {"\u2192"} {newHp})
          </button>
        </div>
      </div>
    </div>
  );
}
