import { useGameStore } from "../store/gameStore";
import { EVOLUTIONS } from "../data/evolutions";
import { formatNumber } from "../utils/format";

export function EvolutionBar() {
  const lifetimeMagicules = useGameStore((s) => s.lifetimeMagicules);
  const evolutionIndex = useGameStore((s) => s.evolutionIndex);
  const prestigeCount = useGameStore((s) => s.prestigeCount);

  const current = EVOLUTIONS[evolutionIndex];
  const next = EVOLUTIONS[evolutionIndex + 1];

  const progress = next
    ? Math.min(1, (lifetimeMagicules - current.threshold) / (next.threshold - current.threshold))
    : 1;

  return (
    <div className="px-4 py-2">
      <div className="flex justify-between items-center text-sm mb-1">
        <span className="text-accent font-semibold">
          {current.emoji} {current.name}
          {prestigeCount > 0 && (
            <span className="text-yellow-400 ml-1">★{prestigeCount}</span>
          )}
        </span>
        {next ? (
          <span className="text-gray-400">
            Next: {next.emoji} {next.name} ({formatNumber(next.threshold)})
          </span>
        ) : (
          <span className="text-yellow-400 text-xs">MAX EVOLUTION</span>
        )}
      </div>
      <div className="w-full h-3 bg-navy-700 rounded-full overflow-hidden border border-navy-700 relative">
        <div
          className="h-full bg-gradient-to-r from-steel to-accent rounded-full transition-all duration-300 animate-bar-glow"
          style={{ width: `${progress * 100}%` }}
        />
        {/* Glow intensifies near completion */}
        {progress > 0.7 && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent ${(progress - 0.15) * 100}%, rgba(167,139,250,${0.3 + (progress - 0.7) * 1.5}) 100%)`,
              animation: "pulseGlow 1.2s ease-in-out infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}
