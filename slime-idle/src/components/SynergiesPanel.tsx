import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { SYNERGIES } from "../data/synergies";

export function SynergiesPanel({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const ownedItems = useGameStore((s) => s.ownedItems);

  const activeSynergies = SYNERGIES.filter((s) => s.requires.every((id) => (ownedItems[id] ?? 0) > 0));

  if (!onClose && !open) {
    if (activeSynergies.length === 0) return null;
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-green-500 hover:text-green-300 px-3 py-1">
        🔗 {activeSynergies.length}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-steel/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-steel font-bold mb-3">🔗 Synergies</h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          {SYNERGIES.map((syn) => {
            const active = syn.requires.every((id) => (ownedItems[id] ?? 0) > 0);
            const progress = syn.requires.filter((id) => (ownedItems[id] ?? 0) > 0).length;
            return (
              <div key={syn.id} className={`p-2.5 rounded-lg border text-sm ${active ? "border-green-500/30 bg-green-900/10" : "border-gray-700/30 bg-navy-900/30 opacity-50"}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`font-semibold ${active ? "text-green-400" : "text-white"}`}>
                    {syn.emoji} {syn.name} {active && "✓"}
                  </span>
                  <span className="text-xs text-gray-500">{progress}/{syn.requires.length}</span>
                </div>
                <p className="text-xs text-gray-400">{syn.description}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Requires: {syn.requires.join(", ")}</p>
              </div>
            );
          })}
        </div>
        <button onClick={() => onClose ? onClose() : setOpen(false)} className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm border border-steel/20">Close</button>
      </div>
    </div>
  );
}
