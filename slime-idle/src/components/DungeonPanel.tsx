import { useState } from "react";
import { useExtraStore } from "../store/extraStore";
import { useGameStore } from "../store/gameStore";
import { DUNGEONS } from "../data/dungeons";
import { formatTime } from "../utils/format";

export function DungeonPanel() {
  const [open, setOpen] = useState(false);
  const activeDungeon = useExtraStore((s) => s.activeDungeon);
  const dungeonsCompleted = useExtraStore((s) => s.dungeonsCompleted);
  const startDungeon = useExtraStore((s) => s.startDungeon);
  const checkDungeon = useExtraStore((s) => s.checkDungeon);
  const ownedItems = useGameStore((s) => s.ownedItems);

  const allyIds = ["gobta", "ranga", "shion", "benimaru", "shuna", "souei", "diablo", "veldora", "guy_crimson", "chloe", "velgrynd", "veldanava", "ivarage"];
  const totalAllies = allyIds.reduce((sum, id) => sum + (ownedItems[id] ?? 0), 0);

  if (!open) {
    const hasActive = !!activeDungeon;
    const timeLeft = activeDungeon ? Math.max(0, (activeDungeon.endTime - Date.now()) / 1000) : 0;
    const done = activeDungeon && Date.now() >= activeDungeon.endTime;
    return (
      <button onClick={() => { if (done) checkDungeon(); setOpen(true); }} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1">
        🕳️ {hasActive ? (done ? "Collect!" : formatTime(timeLeft)) : "Dungeons"}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-steel/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-steel font-bold mb-1">🕳️ Dungeon Expeditions</h2>
        <p className="text-xs text-gray-400 mb-3">Send allies on timed expeditions. You have {totalAllies} allies. Completed: {dungeonsCompleted}</p>

        {activeDungeon && (() => {
          const dg = DUNGEONS.find((d) => d.id === activeDungeon.dungeonId);
          const timeLeft = Math.max(0, (activeDungeon.endTime - Date.now()) / 1000);
          const done = timeLeft <= 0;
          const progress = done ? 1 : 1 - timeLeft / ((activeDungeon.endTime - activeDungeon.startTime) / 1000);
          return (
            <div className="mb-3 p-3 rounded-lg border border-accent/30 bg-accent/5">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-accent font-semibold">{dg?.emoji} {dg?.name}</span>
                <span className="text-gray-400">{done ? "Done!" : formatTime(timeLeft)}</span>
              </div>
              <div className="w-full h-2 bg-navy-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
              {done && (
                <button onClick={() => checkDungeon()} className="w-full py-1.5 bg-accent/20 text-accent rounded border border-accent/40 text-sm font-bold">
                  Collect Rewards!
                </button>
              )}
            </div>
          );
        })()}

        <div className="flex-1 overflow-y-auto space-y-2">
          {DUNGEONS.map((dg) => {
            const canStart = !activeDungeon && totalAllies >= dg.requiredAllies;
            const locked = totalAllies < dg.requiredAllies;
            return (
              <div key={dg.id} className={`p-3 rounded-lg border ${locked ? "border-gray-700/30 bg-navy-900/30 opacity-40" : "border-steel/20 bg-navy-900/30"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white text-sm">{dg.emoji} {dg.name}</span>
                  <span className="text-xs text-gray-500">{formatTime(dg.duration)}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{dg.description}</p>
                <p className="text-xs text-gray-500 mb-2">
                  Requires {dg.requiredAllies} allies | {Math.round(dg.reward.artifactChance * 100)}% artifact | ×{dg.reward.magiculesMult} passive reward
                </p>
                <button
                  onClick={() => startDungeon(dg)}
                  disabled={!canStart}
                  className={`text-xs px-3 py-1 rounded ${canStart ? "bg-steel/20 text-steel border border-steel/40 hover:bg-steel/30" : "bg-gray-700/20 text-gray-600 cursor-not-allowed"}`}
                >
                  {locked ? `Need ${dg.requiredAllies} allies` : activeDungeon ? "Busy" : "Send Expedition"}
                </button>
              </div>
            );
          })}
        </div>
        <button onClick={() => setOpen(false)} className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm border border-steel/20">Close</button>
      </div>
    </div>
  );
}
