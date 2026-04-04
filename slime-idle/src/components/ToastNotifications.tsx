import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ACHIEVEMENTS } from "../data/achievements";
import { EVOLUTIONS } from "../data/evolutions";

interface Toast {
  id: number;
  text: string;
  emoji: string;
  type: "achievement" | "evolution" | "storm";
}

let toastId = 0;

export function ToastNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevAchRef = useRef<string[]>([]);
  const prevEvoRef = useRef(0);
  const prevStormRef = useRef(false);
  const initializedRef = useRef(false);

  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const evolutionIndex = useGameStore((s) => s.evolutionIndex);
  const stormActive = useGameStore((s) => s.stormActive);
  const stormMultiplier = useGameStore((s) => s.stormMultiplier);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = toastId++;
    setToasts((t) => [...t.slice(-3), { ...toast, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  // Initialize refs on first render to avoid stale toasts from loaded saves
  useEffect(() => {
    if (!initializedRef.current) {
      prevAchRef.current = unlockedAchievements;
      prevEvoRef.current = evolutionIndex;
      prevStormRef.current = stormActive;
      initializedRef.current = true;
    }
  });

  // Watch for new achievements
  useEffect(() => {
    if (!initializedRef.current) return;
    const newOnes = unlockedAchievements.filter((id) => !prevAchRef.current.includes(id));
    for (const id of newOnes) {
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (ach) addToast({ text: `${ach.name} — ×${ach.reward.value}`, emoji: "🏆", type: "achievement" });
    }
    prevAchRef.current = unlockedAchievements;
  }, [unlockedAchievements]);

  // Watch for evolution
  useEffect(() => {
    if (!initializedRef.current) return;
    if (evolutionIndex > prevEvoRef.current) {
      const evo = EVOLUTIONS[evolutionIndex];
      if (evo) addToast({ text: `${evo.name}!`, emoji: evo.emoji, type: "evolution" });
    }
    prevEvoRef.current = evolutionIndex;
  }, [evolutionIndex]);

  // Watch for storm
  useEffect(() => {
    if (!initializedRef.current) return;
    if (stormActive && !prevStormRef.current) {
      addToast({ text: `Magicule Storm ×${stormMultiplier}!`, emoji: "🌀", type: "storm" });
    }
    prevStormRef.current = stormActive;
  }, [stormActive, stormMultiplier]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg pointer-events-none
            ${t.type === "achievement" ? "bg-yellow-600/90 text-white" : ""}
            ${t.type === "evolution" ? "bg-accent/90 text-white" : ""}
            ${t.type === "storm" ? "bg-steel/90 text-navy-900" : ""}
          `}
          style={{
            animation: "floatUp 3s ease-out forwards",
          }}
        >
          {t.emoji} {t.text}
        </div>
      ))}
    </div>
  );
}
