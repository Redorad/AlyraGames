import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { EVOLUTIONS } from "../data/evolutions";
import { formatNumber, formatTime } from "../utils/format";

export function StatsPanel() {
  const [open, setOpen] = useState(false);
  const totalClicks = useGameStore((s) => s.totalClicks);
  const lifetimeMagicules = useGameStore((s) => s.lifetimeMagicules);
  const evolutionIndex = useGameStore((s) => s.evolutionIndex);
  const startTime = useGameStore((s) => s.startTime);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const prestigePoints = useGameStore((s) => s.prestigePoints);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const completedChallenges = useGameStore((s) => s.completedChallenges);
  const totalCriticals = useGameStore((s) => s.totalCriticals);
  const getChallengeMultiplier = useGameStore((s) => s.getChallengeMultiplier);
  const getAchievementMultiplier = useGameStore((s) => s.getAchievementMultiplier);
  const getCritChance = useGameStore((s) => s.getCritChance);
  const getCritMultiplier = useGameStore((s) => s.getCritMultiplier);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1"
      >
        📊 Stats
      </button>
    );
  }

  const timePlayed = (Date.now() - startTime) / 1000;

  const rows: [string, string, string?][] = [
    ["Total Clicks", formatNumber(totalClicks)],
    ["Total Criticals", formatNumber(totalCriticals)],
    ["Lifetime Magicules", formatNumber(lifetimeMagicules)],
    ["Evolution", `${EVOLUTIONS[evolutionIndex].emoji} ${EVOLUTIONS[evolutionIndex].name}`],
    ["Time Played", formatTime(timePlayed)],
    ["Achievements", `${unlockedAchievements.length}`],
    ["Achievement Bonus", `×${getAchievementMultiplier("all_mult").toFixed(2)}`, "text-yellow-400"],
    ["Crit Chance", `${Math.round(getCritChance() * 100)}%`],
    ["Crit Multiplier", `×${getCritMultiplier().toFixed(1)}`],
  ];

  if (prestigeCount > 0) {
    rows.push(
      ["---", ""],
      ["Prestige Level", `★${prestigeCount}`, "text-yellow-400"],
      ["Prestige Points", `${prestigePoints}`, "text-yellow-400"],
      ["Challenges Done", `${completedChallenges.length}`],
      ["Challenge Bonus", `×${getChallengeMultiplier().toFixed(2)}`, "text-green-400"],
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-steel/30 rounded-xl p-5 max-w-xs w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-steel font-bold mb-3">📊 Statistics</h2>
        <div className="space-y-2 text-sm text-gray-300">
          {rows.map(([label, value, color], i) =>
            label === "---" ? (
              <hr key={i} className="border-navy-700" />
            ) : (
              <div key={i} className="flex justify-between">
                <span>{label}</span>
                <span className={color ?? "text-white"}>{value}</span>
              </div>
            )
          )}
        </div>
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
