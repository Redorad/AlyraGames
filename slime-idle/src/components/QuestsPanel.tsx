import { useState } from "react";
import { useExtraStore } from "../store/extraStore";
import { DAILY_QUESTS, MILESTONE_QUESTS } from "../data/quests";

export function QuestsPanel({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const completedQuests = useExtraStore((s) => s.completedQuests);
  const dailyClicks = useExtraStore((s) => s.dailyQuestClicks);

  const totalDone = completedQuests.length;
  const totalQuests = DAILY_QUESTS.length + MILESTONE_QUESTS.length;

  if (!onClose && !open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1">
        📋 Quests
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-steel/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-steel font-bold mb-3">📋 Quests ({totalDone}/{totalQuests})</h2>

        <h3 className="text-xs text-accent font-semibold mb-1">Daily (clicks today: {dailyClicks})</h3>
        <div className="space-y-1.5 mb-3">
          {DAILY_QUESTS.map((q) => {
            const done = completedQuests.includes(q.id);
            return (
              <div key={q.id} className={`flex items-center gap-2 p-2 rounded border text-xs ${done ? "border-green-500/30 bg-green-900/10" : "border-gray-700/30 bg-navy-900/30"}`}>
                <span>{done ? "✅" : q.emoji}</span>
                <span className={`flex-1 ${done ? "text-green-400 line-through" : "text-white"}`}>{q.description}</span>
                <span className="text-gray-500">{q.reward.magicules?.toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        <h3 className="text-xs text-accent font-semibold mb-1">Milestones</h3>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {MILESTONE_QUESTS.map((q) => {
            const done = completedQuests.includes(q.id);
            return (
              <div key={q.id} className={`flex items-center gap-2 p-2 rounded border text-xs ${done ? "border-green-500/30 bg-green-900/10" : "border-gray-700/30 bg-navy-900/30"}`}>
                <span>{done ? "✅" : q.emoji}</span>
                <div className="flex-1">
                  <div className={done ? "text-green-400 line-through" : "text-white"}>{q.name}</div>
                  <div className="text-gray-500">{q.description}</div>
                </div>
                <span className="text-gray-500">{q.reward.magicules?.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
        <button onClick={() => onClose ? onClose() : setOpen(false)} className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm border border-steel/20">Close</button>
      </div>
    </div>
  );
}
