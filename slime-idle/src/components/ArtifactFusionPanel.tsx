import { useState } from "react";
import { ARTIFACTS, Artifact } from "../data/artifacts";
import { useExtraStore } from "../store/extraStore";

const RARITY_ORDER: Artifact["rarity"][] = ["common", "rare", "epic", "legendary"];

const RARITY_COLORS: Record<Artifact["rarity"], string> = {
  common: "text-gray-300",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};

const RARITY_BORDER: Record<Artifact["rarity"], string> = {
  common: "border-gray-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-yellow-500/30",
};

function getNextRarity(rarity: Artifact["rarity"]): Artifact["rarity"] | null {
  const idx = RARITY_ORDER.indexOf(rarity);
  if (idx < 0 || idx >= RARITY_ORDER.length - 1) return null;
  return RARITY_ORDER[idx + 1];
}

export function ArtifactFusionPanel() {
  const [open, setOpen] = useState(false);
  const ownedArtifacts = useExtraStore((s) => s.ownedArtifacts);

  // Count duplicates
  const counts: Record<string, number> = {};
  for (const id of ownedArtifacts) {
    counts[id] = (counts[id] ?? 0) + 1;
  }

  // Group by artifact, sorted by rarity
  const grouped = Object.entries(counts)
    .map(([id, count]) => {
      const art = ARTIFACTS.find((a) => a.id === id);
      return art ? { art, count } : null;
    })
    .filter(Boolean)
    .sort((a, b) => RARITY_ORDER.indexOf(a!.art.rarity) - RARITY_ORDER.indexOf(b!.art.rarity)) as {
    art: Artifact;
    count: number;
  }[];

  const fusableCount = grouped.filter(
    (g) => g.count >= 3 && getNextRarity(g.art.rarity) !== null
  ).length;

  function handleFuse(art: Artifact) {
    const nextRarity = getNextRarity(art.rarity);
    if (!nextRarity) return;

    // Pick a random artifact of the next rarity
    const candidates = ARTIFACTS.filter((a) => a.rarity === nextRarity);
    if (candidates.length === 0) return;
    const newArtifact = candidates[Math.floor(Math.random() * candidates.length)];

    useExtraStore.setState((s) => {
      const newArts = [...s.ownedArtifacts];
      let removed = 0;
      const filtered = newArts.filter((id) => {
        if (id === art.id && removed < 3) {
          removed++;
          return false;
        }
        return true;
      });
      filtered.push(newArtifact.id);
      return { ownedArtifacts: filtered };
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1"
      >
        {"\uD83D\uDD27"} Fusion{fusableCount > 0 ? ` (${fusableCount})` : ""}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass rounded-xl p-5 max-w-sm w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-steel font-bold mb-1 text-lg">
          {"\uD83D\uDD27"} Artifact Fusion
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Combine 3 identical artifacts to forge one of higher rarity.
        </p>

        {grouped.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No artifacts owned.</p>
        ) : (
          <div className="space-y-2">
            {grouped.map(({ art, count }) => {
              const nextRarity = getNextRarity(art.rarity);
              const canFuse = count >= 3 && nextRarity !== null;

              return (
                <div
                  key={art.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    RARITY_BORDER[art.rarity]
                  } ${canFuse ? "bg-white/5" : "bg-white/[0.02]"}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl flex-shrink-0">{art.emoji}</span>
                    <div className="min-w-0">
                      <div className={`text-sm font-medium truncate ${RARITY_COLORS[art.rarity]}`}>
                        {art.name}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{art.rarity}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-sm font-mono ${
                        canFuse ? "text-green-400" : "text-gray-500"
                      }`}
                    >
                      x{count}
                    </span>
                    {canFuse && (
                      <button
                        onClick={() => handleFuse(art)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors active:scale-95"
                      >
                        Fuse
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => setOpen(false)}
          className="mt-4 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm hover:bg-navy-800 border border-steel/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
