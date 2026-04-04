import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { WORLD_MAP, WorldLocation } from "../data/worldMap";

const STORAGE_KEY = "slime-idle-worldmap";

function loadDiscovered(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDiscovered(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function WorldMapPanel() {
  const [open, setOpen] = useState(false);
  const [discovered, setDiscovered] = useState<string[]>(loadDiscovered);
  const evolutionIndex = useGameStore((s) => s.evolutionIndex);

  useEffect(() => {
    saveDiscovered(discovered);
  }, [discovered]);

  const totalBonus = discovered.reduce((acc, id) => {
    const loc = WORLD_MAP.find((l) => l.id === id);
    return loc ? acc * loc.passiveBonus : acc;
  }, 1);

  const discoverLocation = useCallback(
    (loc: WorldLocation) => {
      if (discovered.includes(loc.id)) return;
      if (evolutionIndex < loc.unlockEvolution) return;
      setDiscovered((prev) => [...prev, loc.id]);
    },
    [discovered, evolutionIndex],
  );

  // Build lookup
  const nodeMap = Object.fromEntries(WORLD_MAP.map((l) => [l.id, l]));

  // Collect edges (deduplicated)
  const edgeSet = new Set<string>();
  const edges: { from: WorldLocation; to: WorldLocation }[] = [];
  for (const loc of WORLD_MAP) {
    for (const cid of loc.connections) {
      const key = [loc.id, cid].sort().join("-");
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      const other = nodeMap[cid];
      if (other) edges.push({ from: loc, to: other });
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="shimmer-btn text-xs px-3 py-1 rounded bg-sky-600/20 text-sky-400 border border-sky-600/40 hover:bg-sky-600/30 transition-colors"
      >
        🗺️ World Map
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass border border-sky-500/30 rounded-xl p-4 max-w-sm w-full max-h-[85vh] flex flex-col">
        <h2 className="text-sky-400 font-bold mb-1">🗺️ World Map</h2>
        <p className="text-sm text-gray-400 mb-1">
          Discovered:{" "}
          <span className="text-sky-300 font-bold">
            {discovered.length}/{WORLD_MAP.length}
          </span>
        </p>
        {totalBonus > 1 && (
          <p className="text-xs text-emerald-400 mb-3">
            Passive bonus: x{totalBonus.toFixed(2)}
          </p>
        )}

        <div className="flex-1 overflow-y-auto relative" style={{ minHeight: 420 }}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            className="w-full"
            style={{ minHeight: 400 }}
          >
            {/* connection lines */}
            {edges.map(({ from, to }) => {
              const fromDisc = discovered.includes(from.id);
              const toDisc = discovered.includes(to.id);
              return (
                <line
                  key={`${from.id}-${to.id}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={fromDisc && toDisc ? "#38bdf8" : "#334155"}
                  strokeWidth={0.4}
                  strokeDasharray={fromDisc && toDisc ? undefined : "1 1"}
                />
              );
            })}

            {/* location nodes */}
            {WORLD_MAP.map((loc) => {
              const isDiscovered = discovered.includes(loc.id);
              const canDiscover = !isDiscovered && evolutionIndex >= loc.unlockEvolution;
              const locked = !isDiscovered && evolutionIndex < loc.unlockEvolution;

              return (
                <g
                  key={loc.id}
                  onClick={() => discoverLocation(loc)}
                  className={canDiscover ? "cursor-pointer" : locked ? "cursor-not-allowed" : "cursor-default"}
                >
                  {/* glow for discoverable */}
                  {canDiscover && (
                    <circle
                      cx={loc.x}
                      cy={loc.y}
                      r={4}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={0.3}
                      opacity={0.5}
                    >
                      <animate
                        attributeName="r"
                        values="3.5;5;3.5"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.5;0.1;0.5"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* circle bg */}
                  <circle
                    cx={loc.x}
                    cy={loc.y}
                    r={3}
                    fill={
                      isDiscovered
                        ? "rgba(14,165,233,0.35)"
                        : canDiscover
                        ? "rgba(14,165,233,0.15)"
                        : "rgba(15,23,42,0.5)"
                    }
                    stroke={
                      isDiscovered
                        ? "#38bdf8"
                        : canDiscover
                        ? "#0ea5e9"
                        : "#1e293b"
                    }
                    strokeWidth={0.4}
                    opacity={locked ? 0.3 : 1}
                  />

                  {/* emoji */}
                  <text
                    x={loc.x}
                    y={loc.y + 1.2}
                    textAnchor="middle"
                    fontSize={3}
                    opacity={locked ? 0.25 : 1}
                  >
                    {loc.emoji}
                  </text>

                  {/* name label */}
                  <text
                    x={loc.x}
                    y={loc.y + 5.5}
                    textAnchor="middle"
                    fontSize={1.8}
                    fill={isDiscovered ? "#e2e8f0" : canDiscover ? "#94a3b8" : "#475569"}
                    fontWeight="bold"
                  >
                    {loc.name}
                  </text>

                  {/* bonus indicator */}
                  {isDiscovered && (
                    <text
                      x={loc.x}
                      y={loc.y + 7.5}
                      textAnchor="middle"
                      fontSize={1.4}
                      fill="#34d399"
                    >
                      x{loc.passiveBonus}
                    </text>
                  )}

                  {/* locked requirement */}
                  {locked && (
                    <text
                      x={loc.x}
                      y={loc.y + 7.5}
                      textAnchor="middle"
                      fontSize={1.3}
                      fill="#64748b"
                    >
                      Evo {loc.unlockEvolution}
                    </text>
                  )}

                  {/* tap prompt */}
                  {canDiscover && (
                    <text
                      x={loc.x}
                      y={loc.y + 7.5}
                      textAnchor="middle"
                      fontSize={1.3}
                      fill="#fbbf24"
                    >
                      Tap to discover
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm hover:bg-navy-800 border border-steel/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
