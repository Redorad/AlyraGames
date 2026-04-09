import { useGameStore } from "../store/gameStore";
import { NODE_EMOJI, NODE_COLORS } from "../data/map";
import PlayerBar from "./PlayerBar";

export default function MapScreen() {
  const { map, availableNodeIds, act, player } = useGameStore();
  const selectNode = useGameStore((s) => s.selectNode);

  return (
    <div className="h-full flex flex-col bg-navy-900">
      <PlayerBar />

      <div className="text-center py-3 border-b border-white/5">
        <span className="text-xs text-gray-500">Act {act}</span>
        <h2 className="text-lg font-bold text-white">
          {act === 1 ? "Jura Forest" : act === 2 ? "Walpurgis" : "The Demon Realm"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-sm mx-auto space-y-6">
          {[...map].reverse().map((row, ri) => (
            <div key={ri} className="flex justify-center gap-4">
              {row.map((node) => {
                const isAvailable = availableNodeIds.includes(node.id);
                const emoji = NODE_EMOJI[node.type];
                const color = NODE_COLORS[node.type];

                return (
                  <button
                    key={node.id}
                    disabled={!isAvailable}
                    onClick={() => isAvailable && selectNode(node.id)}
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl border-2 transition-all
                      ${isAvailable
                        ? "border-white/40 bg-navy-700 hover:scale-110 hover:border-white/60 cursor-pointer"
                        : node.cleared
                          ? "border-green-500/30 bg-green-500/10 opacity-50"
                          : "border-white/10 bg-navy-800/50 opacity-30 cursor-not-allowed"
                      }`}
                    style={isAvailable ? { borderColor: color + "80", boxShadow: `0 0 12px ${color}30` } : undefined}
                    title={node.type}
                  >
                    {node.cleared ? "\u{2713}" : emoji}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 px-4 py-2 border-t border-white/5 text-xs text-gray-500 shrink-0">
        {Object.entries(NODE_EMOJI).map(([type, emoji]) => (
          <span key={type} className="flex items-center gap-1">
            <span>{emoji}</span>
            <span className="capitalize">{type === "combat" ? "Combat" : type === "elite" ? "Elite" : type === "boss" ? "Boss" : type === "event" ? "Event" : type === "rest" ? "Rest" : "Shop"}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
