import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";

export function EvolutionFlash() {
  const [flashing, setFlashing] = useState(false);
  const evolutionIndex = useGameStore((s) => s.evolutionIndex);
  const prevEvo = useRef(evolutionIndex);

  useEffect(() => {
    if (evolutionIndex > prevEvo.current) {
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 800);
      prevEvo.current = evolutionIndex;
      return () => clearTimeout(t);
    }
    prevEvo.current = evolutionIndex;
  }, [evolutionIndex]);

  if (!flashing) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <div
        className="absolute inset-0 animate-evo-flash"
        style={{
          background: "radial-gradient(circle, rgba(167,139,250,0.6) 0%, rgba(126,200,227,0.3) 40%, transparent 70%)",
        }}
      />
      <div
        className="text-6xl animate-evo-flash"
        style={{ filter: "drop-shadow(0 0 30px rgba(167,139,250,0.8))" }}
      >
        ✦
      </div>
    </div>
  );
}
