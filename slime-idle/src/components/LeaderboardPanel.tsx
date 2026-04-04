import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { useExtraStore } from "../store/extraStore";
import { EVOLUTIONS } from "../data/evolutions";
import { formatNumber } from "../utils/format";

const STORAGE_KEY = "slime-idle-leaderboard";

interface RunRecord {
  id: number;
  date: string;
  prestigeNum: number;
  peakEvolution: string;
  peakEvolutionIdx: number;
  magiculesEarned: number;
  prestigePointsEarned: number;
  totalClicks: number;
  runDuration: number; // seconds
}

interface LeaderboardData {
  runs: RunRecord[];
  allTimeBestMagicules: number;
  allTimeBestEvolution: number;
  allTimeFastestMaxEvo: number | null; // seconds to reach max evo
  totalPrestigesTracked: number;
}

function loadData(): LeaderboardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    runs: [],
    allTimeBestMagicules: 0,
    allTimeBestEvolution: 0,
    allTimeFastestMaxEvo: null,
    totalPrestigesTracked: 0,
  };
}

function saveData(data: LeaderboardData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// Record a run when prestige happens
export function recordPrestigeRun() {
  const state = useGameStore.getState();
  const data = loadData();
  const runDuration = (Date.now() - state.startTime) / 1000;

  const record: RunRecord = {
    id: Date.now(),
    date: new Date().toLocaleDateString(),
    prestigeNum: state.prestigeCount, // this is the count BEFORE this prestige
    peakEvolution: EVOLUTIONS[state.evolutionIndex]?.name ?? "Unknown",
    peakEvolutionIdx: state.evolutionIndex,
    magiculesEarned: state.lifetimeMagicules,
    prestigePointsEarned: Math.floor(
      1 + Math.pow(state.evolutionIndex - 6, 1.5) +
      Math.log10(Math.max(1, state.lifetimeMagicules)) * 0.5
    ),
    totalClicks: state.totalClicks,
    runDuration,
  };

  data.runs.unshift(record);
  // Keep top 50 runs
  if (data.runs.length > 50) data.runs.length = 50;

  // Update all-time records
  if (state.lifetimeMagicules > data.allTimeBestMagicules) {
    data.allTimeBestMagicules = state.lifetimeMagicules;
  }
  if (state.evolutionIndex > data.allTimeBestEvolution) {
    data.allTimeBestEvolution = state.evolutionIndex;
  }
  if (state.evolutionIndex >= EVOLUTIONS.length - 1) {
    if (data.allTimeFastestMaxEvo === null || runDuration < data.allTimeFastestMaxEvo) {
      data.allTimeFastestMaxEvo = runDuration;
    }
  }
  data.totalPrestigesTracked++;

  saveData(data);
}

type SortKey = "magicules" | "evolution" | "speed" | "clicks";

export function LeaderboardPanel({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<LeaderboardData>(loadData);
  const [sortBy, setSortBy] = useState<SortKey>("magicules");

  // Refresh data when opening
  useEffect(() => {
    if (open || onClose) setData(loadData());
  }, [open, onClose]);

  if (!onClose && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1"
      >
        🏆 Leaderboard
      </button>
    );
  }

  const sortedRuns = [...data.runs].sort((a, b) => {
    switch (sortBy) {
      case "magicules": return b.magiculesEarned - a.magiculesEarned;
      case "evolution": return b.peakEvolutionIdx - a.peakEvolutionIdx;
      case "speed": return a.runDuration - b.runDuration;
      case "clicks": return b.totalClicks - a.totalClicks;
    }
  });

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-yellow-500/30 rounded-xl p-4 max-w-sm w-full max-h-[85vh] flex flex-col">
        <h2 className="text-yellow-400 font-bold mb-1">🏆 Hall of Fame</h2>
        <p className="text-xs text-gray-400 mb-3">Your personal best runs across all prestiges</p>

        {/* All-time records */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-navy-900/50 rounded-lg p-2 border border-yellow-500/10">
            <p className="text-[10px] text-gray-500">Best Magicules</p>
            <p className="text-sm text-yellow-400 font-bold">{formatNumber(data.allTimeBestMagicules)}</p>
          </div>
          <div className="bg-navy-900/50 rounded-lg p-2 border border-yellow-500/10">
            <p className="text-[10px] text-gray-500">Best Evolution</p>
            <p className="text-sm text-cyan-400 font-bold">
              {EVOLUTIONS[data.allTimeBestEvolution]?.emoji} {EVOLUTIONS[data.allTimeBestEvolution]?.name ?? "—"}
            </p>
          </div>
          <div className="bg-navy-900/50 rounded-lg p-2 border border-yellow-500/10">
            <p className="text-[10px] text-gray-500">Fastest Max Evo</p>
            <p className="text-sm text-green-400 font-bold">
              {data.allTimeFastestMaxEvo !== null ? formatDuration(data.allTimeFastestMaxEvo) : "—"}
            </p>
          </div>
          <div className="bg-navy-900/50 rounded-lg p-2 border border-yellow-500/10">
            <p className="text-[10px] text-gray-500">Total Prestiges</p>
            <p className="text-sm text-purple-400 font-bold">{data.totalPrestigesTracked}</p>
          </div>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-1 mb-2">
          {([
            { key: "magicules" as SortKey, label: "Magicules" },
            { key: "evolution" as SortKey, label: "Evolution" },
            { key: "speed" as SortKey, label: "Speed" },
            { key: "clicks" as SortKey, label: "Clicks" },
          ]).map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                sortBy === s.key
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  : "text-gray-500 border border-transparent hover:text-gray-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Run list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
          {sortedRuns.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              No runs recorded yet. Prestige to record your first run!
            </div>
          ) : (
            sortedRuns.map((run, i) => (
              <div
                key={run.id}
                className={`p-2.5 rounded-lg border text-xs ${
                  i < 3
                    ? "border-yellow-500/20 bg-yellow-900/5"
                    : "border-gray-700/20 bg-navy-900/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">
                    {i < 3 ? medals[i] : `#${i + 1}`} Prestige #{run.prestigeNum + 1}
                  </span>
                  <span className="text-gray-500">{run.date}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>{EVOLUTIONS[run.peakEvolutionIdx]?.emoji} {run.peakEvolution}</span>
                  <span className="text-yellow-400">{formatNumber(run.magiculesEarned)} mag</span>
                </div>
                <div className="flex justify-between text-gray-500 mt-0.5">
                  <span>{formatDuration(run.runDuration)}</span>
                  <span>{formatNumber(run.totalClicks)} clicks</span>
                  <span className="text-purple-400">+{run.prestigePointsEarned} PP</span>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => onClose ? onClose() : setOpen(false)}
          className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm hover:bg-navy-800 border border-steel/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
