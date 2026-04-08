import { useGameStore } from "../store/gameStore";

export default function PlayerBar() {
  const player = useGameStore((s) => s.player);
  const act = useGameStore((s) => s.act);
  const floor = useGameStore((s) => s.floor);
  const deck = useGameStore((s) => s.deck);

  const hpPct = (player.hp / player.maxHp) * 100;
  const hpColor = hpPct > 60 ? "#4ade80" : hpPct > 30 ? "#fbbf24" : "#ef4444";

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-navy-800 border-b border-white/5 text-sm shrink-0">
      <span className="text-xl">{"\u{1F9CA}"}</span>

      {/* HP bar */}
      <div className="flex-1 max-w-[180px]">
        <div className="flex justify-between text-xs mb-0.5">
          <span style={{ color: hpColor }}>{"\u{2764}\u{FE0F}"} {player.hp}/{player.maxHp}</span>
        </div>
        <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${hpPct}%`, backgroundColor: hpColor }}
          />
        </div>
      </div>

      <span className="text-yellow-400 text-xs font-bold">{player.gold}G</span>
      <span className="text-gray-500 text-xs">{"\u{1F0CF}"}{deck.length}</span>
      <span className="text-gray-500 text-xs ml-auto">A{act} E{floor}</span>
    </div>
  );
}
