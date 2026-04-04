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
  const getChallengeMultiplier = useGameStore((s) => s.getChallengeMultiplier);
  const getAchievementMultiplier = useGameStore((s) => s.getAchievementMultiplier);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-steel/30 rounded-xl p-5 max-w-xs w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-steel font-bold mb-3">📊 Statistics</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Total Clicks</span>
            <span className="text-white">{formatNumber(totalClicks)}</span>
          </div>
          <div className="flex justify-between">
            <span>Lifetime Magicules</span>
            <span className="text-white">{formatNumber(lifetimeMagicules)}</span>
          </div>
          <div className="flex justify-between">
            <span>Evolution</span>
            <span className="text-white">{EVOLUTIONS[evolutionIndex].emoji} {EVOLUTIONS[evolutionIndex].name}</span>
          </div>
          <div className="flex justify-between">
            <span>Time Played</span>
            <span className="text-white">{formatTime(timePlayed)}</span>
          </div>
          <div className="flex justify-between">
            <span>Achievements</span>
            <span className="text-white">{unlockedAchievements.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Achievement Bonus</span>
            <span className="text-yellow-400">×{getAchievementMultiplier("all_mult").toFixed(2)}</span>
          </div>
          {prestigeCount > 0 && (
            <>
              <hr className="border-navy-700" />
              <div className="flex justify-between">
                <span>Prestige Level</span>
                <span className="text-yellow-400">★{prestigeCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Prestige Points</span>
                <span className="text-yellow-400">{prestigePoints}</span>
              </div>
              <div className="flex justify-between">
                <span>Challenges Done</span>
                <span className="text-white">{completedChallenges.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Challenge Bonus</span>
                <span className="text-green-400">×{getChallengeMultiplier().toFixed(2)}</span>
              </div>
            </>
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
