import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useExtraStore } from "../store/extraStore";
import { formatNumber, formatTime } from "../utils/format";
import { EVOLUTIONS } from "../data/evolutions";
import { ACHIEVEMENTS } from "../data/achievements";
import { CHALLENGES } from "../data/challenges";
import { BOSSES } from "../data/bosses";

export function StatsDashboard({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);

  const startTime = useGameStore((s) => s.startTime);
  const totalClicks = useGameStore((s) => s.totalClicks);
  const totalCriticals = useGameStore((s) => s.totalCriticals);
  const lifetimeMagicules = useGameStore((s) => s.lifetimeMagicules);
  const magicules = useGameStore((s) => s.magicules);
  const evolutionIndex = useGameStore((s) => s.evolutionIndex);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const prestigePoints = useGameStore((s) => s.prestigePoints);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const completedChallenges = useGameStore((s) => s.completedChallenges);
  const getClickPower = useGameStore((s) => s.getClickPower);
  const getPassivePower = useGameStore((s) => s.getPassivePower);
  const getAchievementMultiplier = useGameStore((s) => s.getAchievementMultiplier);
  const getChallengeMultiplier = useGameStore((s) => s.getChallengeMultiplier);

  const bossesDefeated = useExtraStore((s) => s.bossesDefeated);
  const ownedArtifacts = useExtraStore((s) => s.ownedArtifacts);
  const dungeonsCompleted = useExtraStore((s) => s.dungeonsCompleted);
  const ascensionCount = useExtraStore((s) => s.ascensionCount);
  const ascensionPoints = useExtraStore((s) => s.ascensionPoints);
  const getSynergyMultiplier = useExtraStore((s) => s.getSynergyMultiplier);
  const getArtifactBonus = useExtraStore((s) => s.getArtifactBonus);
  const getAscensionBonus = useExtraStore((s) => s.getAscensionBonus);

  if (!onClose && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1"
      >
        {"\uD83D\uDCCA"} Stats
      </button>
    );
  }

  const timePlayed = (Date.now() - startTime) / 1000;
  const critRate = totalClicks > 0 ? ((totalCriticals / totalClicks) * 100).toFixed(1) : "0.0";
  const evo = EVOLUTIONS[evolutionIndex];

  type StatRow = { label: string; value: string; color?: string } | "divider";

  const stats: StatRow[] = [
    { label: "Play Time", value: formatTime(timePlayed) },
    { label: "Total Clicks", value: formatNumber(totalClicks) },
    { label: "Total Crits", value: formatNumber(totalCriticals) },
    { label: "Crit Rate", value: `${critRate}%` },
    "divider",
    { label: "Lifetime Magicules", value: formatNumber(lifetimeMagicules) },
    { label: "Current Magicules", value: formatNumber(magicules), color: "text-cyan-400" },
    "divider",
    {
      label: "Evolution",
      value: `${evo.emoji} ${evo.name} (#${evolutionIndex + 1})`,
      color: "text-purple-400",
    },
    { label: "Prestige Count", value: `${prestigeCount}`, color: "text-yellow-400" },
    { label: "Prestige Points", value: `${prestigePoints}`, color: "text-yellow-400" },
    { label: "Ascension Count", value: `${ascensionCount}`, color: "text-indigo-400" },
    { label: "Ascension Points", value: `${ascensionPoints}`, color: "text-indigo-400" },
    "divider",
    { label: "Click Power", value: formatNumber(getClickPower()) },
    { label: "Passive Power", value: `${formatNumber(getPassivePower())}/s` },
    "divider",
    {
      label: "Achievements",
      value: `${unlockedAchievements.length} / ${ACHIEVEMENTS.length}`,
    },
    {
      label: "Challenges",
      value: `${completedChallenges.length} / ${CHALLENGES.length}`,
    },
    {
      label: "Bosses Defeated",
      value: `${bossesDefeated.length} / ${BOSSES.length}`,
    },
    { label: "Dungeons Completed", value: `${dungeonsCompleted}` },
    { label: "Artifacts Owned", value: `${ownedArtifacts.length}` },
  ];

  // Multiplier breakdown
  const multipliers: { source: string; value: string }[] = [
    { source: "Evolution", value: `x${(evo.multiplier).toFixed(2)}` },
    { source: "Prestige", value: `x${(1 + prestigeCount * 0.5).toFixed(2)}` },
    {
      source: "Achievements",
      value: `x${getAchievementMultiplier("all_mult").toFixed(2)}`,
    },
    { source: "Challenges", value: `x${getChallengeMultiplier().toFixed(2)}` },
    {
      source: "Synergies",
      value: `x${getSynergyMultiplier("all_mult").toFixed(2)}`,
    },
    { source: "Artifacts", value: `x${getArtifactBonus("all_mult").toFixed(2)}` },
    {
      source: "Ascension",
      value: `x${(1 + getAscensionBonus("all_mult")).toFixed(2)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass rounded-xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto">
        <h2 className="text-steel font-bold mb-3 text-lg">
          {"\uD83D\uDCCA"} Statistics Dashboard
        </h2>

        <div className="space-y-1.5 text-sm text-gray-300">
          {stats.map((row, i) =>
            row === "divider" ? (
              <hr key={i} className="border-white/10 my-2" />
            ) : (
              <div key={i} className="flex justify-between">
                <span className="text-gray-400">{row.label}</span>
                <span className={row.color ?? "text-white"}>{row.value}</span>
              </div>
            )
          )}
        </div>

        <hr className="border-white/10 my-3" />

        <h3 className="text-sm font-bold text-gray-400 mb-2">Multiplier Breakdown</h3>
        <div className="space-y-1 text-sm">
          {multipliers.map((m) => (
            <div key={m.source} className="flex justify-between">
              <span className="text-gray-400">{m.source}</span>
              <span
                className={
                  m.value === "x1.00" ? "text-gray-600" : "text-green-400"
                }
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onClose ? onClose() : setOpen(false)}
          className="mt-4 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm hover:bg-navy-800 border border-steel/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
