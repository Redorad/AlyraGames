import { useState } from "react";
import { useExtraStore } from "../store/extraStore";
import { ARTIFACTS } from "../data/artifacts";

const RARITY_COLORS = {
  common: "text-gray-300 border-gray-500/30",
  rare: "text-blue-300 border-blue-500/30",
  epic: "text-purple-300 border-purple-500/30",
  legendary: "text-yellow-300 border-yellow-500/30",
};

export function ArtifactsPanel({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const ownedArtifacts = useExtraStore((s) => s.ownedArtifacts);

  if (!onClose && !open) {
    if (ownedArtifacts.length === 0) return null;
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1">
        💎 {ownedArtifacts.length}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-steel/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-steel font-bold mb-3">💎 Artifacts ({ownedArtifacts.length}/{ARTIFACTS.length})</h2>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {ARTIFACTS.map((art) => {
            const owned = ownedArtifacts.includes(art.id);
            const colors = RARITY_COLORS[art.rarity];
            return (
              <div key={art.id} className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${owned ? colors : "border-gray-700/20 bg-navy-900/30 opacity-30"}`}>
                <span className="text-xl">{owned ? art.emoji : "❓"}</span>
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${owned ? "" : "text-gray-600"}`}>{owned ? art.name : "???"}</div>
                  <div className="text-xs text-gray-400">{owned ? art.description : art.rarity}</div>
                </div>
                {owned && <span className="text-xs capitalize text-gray-500">{art.rarity}</span>}
              </div>
            );
          })}
        </div>
        <button onClick={() => onClose ? onClose() : setOpen(false)} className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm border border-steel/20">Close</button>
      </div>
    </div>
  );
}
