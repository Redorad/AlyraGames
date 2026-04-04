import { useState, useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { RESEARCH_TREE, Research } from "../data/research";
import { formatNumber, formatTime } from "../utils/format";

const STORAGE_KEY = "slime-idle-research";

interface ResearchState {
  completed: string[];
  active: { id: string; startTime: number; endTime: number } | null;
}

function loadResearchState(): ResearchState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completed: [], active: null };
}

function saveResearchState(state: ResearchState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const TIER_LABELS: Record<number, { name: string; color: string }> = {
  1: { name: "Tier 1 — Foundations", color: "text-blue-400" },
  2: { name: "Tier 2 — Advanced", color: "text-green-400" },
  3: { name: "Tier 3 — Expert", color: "text-purple-400" },
  4: { name: "Tier 4 — Ultimate", color: "text-yellow-400" },
};

export function ResearchPanel({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [research, setResearch] = useState<ResearchState>(loadResearchState);
  const [now, setNow] = useState(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const researchRef = useRef(research);
  researchRef.current = research;

  // Persist on changes
  useEffect(() => {
    saveResearchState(research);
  }, [research]);

  // Timer for active research progress
  useEffect(() => {
    if (!research.active) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }

    tickRef.current = setInterval(() => {
      setNow(Date.now());
      const r = researchRef.current;
      if (r.active && Date.now() >= r.active.endTime) {
        completeResearch(r.active.id);
      }
    }, 250);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [research.active !== null]);

  const completeResearch = useCallback((researchId: string) => {
    const def = RESEARCH_TREE.find((r) => r.id === researchId);
    setResearch((prev) => {
      if (prev.completed.includes(researchId)) return { ...prev, active: null };
      return {
        completed: [...prev.completed, researchId],
        active: null,
      };
    });
    if (def) {
      useGameStore.getState().addEvent(
        `Research complete: ${def.emoji} ${def.name} — ${def.description}`
      );
    }
  }, []);

  const startResearch = useCallback((r: Research) => {
    const state = useGameStore.getState();
    if (state.magicules < r.cost) return;

    useGameStore.setState((s) => ({
      magicules: s.magicules - r.cost,
    }));

    const startTime = Date.now();
    const endTime = startTime + r.duration * 1000;
    setResearch((prev) => ({
      ...prev,
      active: { id: r.id, startTime, endTime },
    }));

    useGameStore.getState().addEvent(
      `Research started: ${r.emoji} ${r.name} (${formatTime(r.duration)})`
    );
  }, []);

  const canResearch = useCallback(
    (r: Research): boolean => {
      if (research.completed.includes(r.id)) return false;
      if (research.active) return false;
      if (r.requires.some((req) => !research.completed.includes(req))) return false;
      return true;
    },
    [research]
  );

  const isLocked = useCallback(
    (r: Research): boolean => {
      return r.requires.some((req) => !research.completed.includes(req));
    },
    [research]
  );

  const magicules = useGameStore((s) => s.magicules);

  // Check completion on open if needed
  useEffect(() => {
    if (research.active && Date.now() >= research.active.endTime) {
      completeResearch(research.active.id);
    }
  }, [open, research.active, completeResearch]);

  if (!onClose && !open) {
    const hasActive = !!research.active;
    const activeTimeLeft = research.active
      ? Math.max(0, (research.active.endTime - Date.now()) / 1000)
      : 0;
    const activeDone = research.active && Date.now() >= research.active.endTime;

    return (
      <button
        onClick={() => {
          if (activeDone && research.active) completeResearch(research.active.id);
          setOpen(true);
        }}
        className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1"
      >
        🔬 {hasActive ? (activeDone ? "Complete!" : formatTime(activeTimeLeft)) : "Research"}
      </button>
    );
  }

  const tiers = [1, 2, 3, 4];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass border border-cyan-500/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-cyan-400 font-bold mb-1">🔬 Research Lab</h2>
        <p className="text-xs text-gray-400 mb-3">
          {research.completed.length}/{RESEARCH_TREE.length} completed
        </p>

        {/* Active research */}
        {research.active && (() => {
          const def = RESEARCH_TREE.find((r) => r.id === research.active!.id);
          if (!def) return null;
          const total = (research.active.endTime - research.active.startTime) / 1000;
          const elapsed = Math.min(total, (now - research.active.startTime) / 1000);
          const remaining = Math.max(0, total - elapsed);
          const progress = elapsed / total;
          const done = remaining <= 0;

          return (
            <div className="mb-3 p-3 rounded-lg border border-cyan-500/30 bg-cyan-900/10">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-cyan-300 font-semibold">{def.emoji} {def.name}</span>
                <span className="text-gray-400">{done ? "Done!" : formatTime(remaining)}</span>
              </div>
              <div className="w-full h-2 bg-navy-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, progress * 100)}%` }}
                />
              </div>
              {done && (
                <button
                  onClick={() => completeResearch(research.active!.id)}
                  className="w-full py-1.5 bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/40 text-sm font-bold"
                >
                  Collect!
                </button>
              )}
            </div>
          );
        })()}

        {/* Research tree by tier */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {tiers.map((tier) => {
            const tierResearch = RESEARCH_TREE.filter((r) => r.tier === tier);
            if (tierResearch.length === 0) return null;
            const tierInfo = TIER_LABELS[tier];

            return (
              <div key={tier}>
                <h3 className={`text-xs font-bold mb-1.5 ${tierInfo.color}`}>
                  {tierInfo.name}
                </h3>
                <div className="space-y-1.5">
                  {tierResearch.map((r) => {
                    const completed = research.completed.includes(r.id);
                    const locked = isLocked(r);
                    const available = canResearch(r);
                    const affordable = magicules >= r.cost;
                    const isActive = research.active?.id === r.id;

                    return (
                      <div
                        key={r.id}
                        className={`p-2.5 rounded-lg border text-sm ${
                          completed
                            ? "border-green-500/30 bg-green-900/10"
                            : locked
                              ? "border-gray-700/30 bg-navy-900/30 opacity-40"
                              : isActive
                                ? "border-cyan-500/30 bg-cyan-900/10"
                                : "border-steel/20 bg-navy-900/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-white text-sm">
                            {r.emoji} {r.name}{" "}
                            {completed && <span className="text-green-400">✓</span>}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(r.duration)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{r.description}</p>
                        {r.requires.length > 0 && !completed && (
                          <p className="text-xs text-gray-600 mb-1">
                            Requires:{" "}
                            {r.requires.map((reqId) => {
                              const req = RESEARCH_TREE.find((x) => x.id === reqId);
                              const done = research.completed.includes(reqId);
                              return (
                                <span
                                  key={reqId}
                                  className={done ? "text-green-400" : "text-red-400"}
                                >
                                  {req?.emoji} {req?.name}
                                  {reqId !== r.requires[r.requires.length - 1] ? ", " : ""}
                                </span>
                              );
                            })}
                          </p>
                        )}
                        {!completed && !isActive && (
                          <button
                            onClick={() => {
                              if (available && affordable) startResearch(r);
                            }}
                            disabled={!available || !affordable}
                            className={`text-xs px-3 py-1 rounded mt-1 ${
                              available && affordable
                                ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-600/30"
                                : "bg-gray-700/20 text-gray-600 cursor-not-allowed"
                            }`}
                          >
                            {locked
                              ? "Locked"
                              : research.active
                                ? "Busy"
                                : !affordable
                                  ? `Need ${formatNumber(r.cost)} mag`
                                  : `Research (${formatNumber(r.cost)} mag)`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onClose ? onClose() : setOpen(false)}
          className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm border border-steel/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
