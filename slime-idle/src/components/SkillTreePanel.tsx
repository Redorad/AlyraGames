import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { SKILL_TREE, SkillNode } from "../data/skillTree";

const STORAGE_KEY = "slime-idle-skilltree";
const GRID_COLS = 5;
const GRID_ROWS = 6;
const CELL_W = 72;
const CELL_H = 80;
const PAD_X = 16;
const PAD_Y = 12;

function loadLevels(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLevels(levels: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
}

function nodeCost(node: SkillNode, level: number): number {
  return Math.floor(node.baseCost * Math.pow(node.costScale, level));
}

function nodeCenter(node: SkillNode): { cx: number; cy: number } {
  return {
    cx: PAD_X + node.x * CELL_W + CELL_W / 2,
    cy: PAD_Y + node.y * CELL_H + CELL_H / 2,
  };
}

export function SkillTreePanel() {
  const [open, setOpen] = useState(false);
  const [levels, setLevels] = useState<Record<string, number>>(loadLevels);
  const prestigePoints = useGameStore((s) => s.prestigePoints);
  const prestigeCount = useGameStore((s) => s.prestigeCount);

  useEffect(() => {
    saveLevels(levels);
  }, [levels]);

  const isUnlocked = useCallback(
    (node: SkillNode) =>
      node.requires.length === 0 ||
      node.requires.every((rid) => (levels[rid] ?? 0) > 0),
    [levels],
  );

  const buyLevel = useCallback(
    (node: SkillNode) => {
      const cur = levels[node.id] ?? 0;
      if (cur >= node.maxLevel) return;
      if (!isUnlocked(node)) return;
      const cost = nodeCost(node, cur);
      const pts = useGameStore.getState().prestigePoints;
      if (pts < cost) return;
      useGameStore.setState({ prestigePoints: pts - cost });
      setLevels((prev) => ({ ...prev, [node.id]: cur + 1 }));
    },
    [levels, isUnlocked],
  );

  if (prestigeCount === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="shimmer-btn text-xs px-3 py-1 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-600/40 hover:bg-emerald-600/30 transition-colors"
      >
        🌳 Skill Tree ({prestigePoints} pts)
      </button>
    );
  }

  const svgW = PAD_X * 2 + GRID_COLS * CELL_W;
  const svgH = PAD_Y * 2 + GRID_ROWS * CELL_H;

  // Build lookup for connections
  const nodeMap = Object.fromEntries(SKILL_TREE.map((n) => [n.id, n]));

  // Collect all edges (parent → child via requires)
  const edges: { from: SkillNode; to: SkillNode }[] = [];
  for (const node of SKILL_TREE) {
    for (const rid of node.requires) {
      const parent = nodeMap[rid];
      if (parent) edges.push({ from: parent, to: node });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass border border-emerald-500/30 rounded-xl p-4 max-w-md w-full max-h-[85vh] flex flex-col">
        <h2 className="text-emerald-400 font-bold mb-1">🌳 Skill Tree</h2>
        <p className="text-sm text-gray-400 mb-3">
          Prestige Points:{" "}
          <span className="text-emerald-400 font-bold">{prestigePoints}</span>
        </p>

        <div className="flex-1 overflow-auto">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            width={svgW}
            height={svgH}
            className="mx-auto"
          >
            {/* connection lines */}
            {edges.map(({ from, to }) => {
              const a = nodeCenter(from);
              const b = nodeCenter(to);
              const unlocked = isUnlocked(to);
              return (
                <line
                  key={`${from.id}-${to.id}`}
                  x1={a.cx}
                  y1={a.cy}
                  x2={b.cx}
                  y2={b.cy}
                  stroke={unlocked ? "#34d399" : "#374151"}
                  strokeWidth={2}
                  strokeDasharray={unlocked ? undefined : "4 4"}
                />
              );
            })}

            {/* nodes */}
            {SKILL_TREE.map((node) => {
              const { cx, cy } = nodeCenter(node);
              const cur = levels[node.id] ?? 0;
              const maxed = cur >= node.maxLevel;
              const unlocked = isUnlocked(node);
              const cost = nodeCost(node, cur);
              const canBuy = unlocked && !maxed && prestigePoints >= cost;

              return (
                <g
                  key={node.id}
                  onClick={() => buyLevel(node)}
                  className={canBuy ? "cursor-pointer" : unlocked ? "cursor-default" : "cursor-not-allowed"}
                >
                  {/* background rect */}
                  <rect
                    x={cx - 30}
                    y={cy - 32}
                    width={60}
                    height={64}
                    rx={8}
                    fill={
                      maxed
                        ? "rgba(16,185,129,0.25)"
                        : unlocked
                        ? "rgba(15,23,42,0.85)"
                        : "rgba(15,23,42,0.4)"
                    }
                    stroke={
                      maxed
                        ? "#10b981"
                        : canBuy
                        ? "#6ee7b7"
                        : unlocked
                        ? "#475569"
                        : "#1e293b"
                    }
                    strokeWidth={1.5}
                    opacity={unlocked ? 1 : 0.4}
                  />
                  {/* emoji */}
                  <text
                    x={cx}
                    y={cy - 12}
                    textAnchor="middle"
                    fontSize={18}
                    opacity={unlocked ? 1 : 0.35}
                  >
                    {node.emoji}
                  </text>
                  {/* name */}
                  <text
                    x={cx}
                    y={cy + 5}
                    textAnchor="middle"
                    fontSize={7}
                    fill={unlocked ? "#e2e8f0" : "#475569"}
                    fontWeight="bold"
                  >
                    {node.name}
                  </text>
                  {/* level / cost */}
                  <text
                    x={cx}
                    y={cy + 17}
                    textAnchor="middle"
                    fontSize={7}
                    fill={maxed ? "#10b981" : canBuy ? "#6ee7b7" : "#64748b"}
                  >
                    {maxed ? "MAX" : `${cur}/${node.maxLevel}`}
                  </text>
                  {!maxed && unlocked && (
                    <text
                      x={cx}
                      y={cy + 27}
                      textAnchor="middle"
                      fontSize={6}
                      fill={canBuy ? "#fbbf24" : "#64748b"}
                    >
                      {cost} pts
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
