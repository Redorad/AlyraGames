import { useState, useCallback, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { formatNumber } from "../utils/format";
import { EVOLUTIONS } from "../data/evolutions";

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number;
}

export function SlimeButton() {
  const click = useGameStore((s) => s.click);
  const getClickPower = useGameStore((s) => s.getClickPower);
  const activeChallenge = useGameStore((s) => s.activeChallenge);
  const evolutionIndex = useGameStore((s) => s.evolutionIndex);
  const [bouncing, setBouncing] = useState(false);
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const nextId = useRef(0);

  const evo = EVOLUTIONS[evolutionIndex];
  const clickDisabled = activeChallenge !== null && getClickPower() === 0;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      if (clickDisabled) return;
      click();
      setBouncing(true);
      setTimeout(() => setBouncing(false), 200);

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      let clientX: number, clientY: number;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        clientX = rect.left + rect.width / 2;
        clientY = rect.top;
      }

      const id = nextId.current++;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const power = getClickPower();
      setFloats((f) => [...f.slice(-8), { id, x, y, value: power }]);
      setTimeout(() => {
        setFloats((f) => f.filter((t) => t.id !== id));
      }, 1000);
    },
    [click, getClickPower, clickDisabled]
  );

  return (
    <div className="relative flex justify-center items-center py-6">
      {/* 3D glow ring behind button */}
      <div
        className="absolute rounded-full"
        style={{
          width: 180,
          height: 180,
          background: "radial-gradient(circle, rgba(126,200,227,0.15) 0%, rgba(167,139,250,0.08) 50%, transparent 70%)",
          filter: "blur(10px)",
          animation: "pulseGlow 3s ease-in-out infinite",
        }}
      />

      <button
        onClick={handleClick}
        disabled={clickDisabled}
        className={`relative select-none cursor-pointer focus:outline-none transition-transform duration-200
          ${clickDisabled ? "opacity-40 cursor-not-allowed" : "active:scale-90"}
          ${bouncing ? "animate-slime-bounce" : ""}`}
        aria-label="Click to absorb magicules"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* 3D slime body */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 150,
            height: 150,
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            background: `radial-gradient(circle at 35% 30%, rgba(200, 240, 255, 0.9), rgba(126, 200, 227, 0.7) 40%, rgba(60, 120, 200, 0.8) 70%, rgba(30, 60, 140, 0.9))`,
            boxShadow: `
              0 8px 30px rgba(126, 200, 227, 0.4),
              0 0 60px rgba(126, 200, 227, 0.15),
              inset 0 -8px 20px rgba(30, 60, 140, 0.5),
              inset 0 8px 20px rgba(200, 240, 255, 0.3)
            `,
          }}
        >
          {/* Highlight / specular reflection */}
          <div
            className="absolute"
            style={{
              top: 18,
              left: 30,
              width: 40,
              height: 25,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(255,255,255,0.7), transparent)",
              filter: "blur(4px)",
            }}
          />
          {/* Small secondary highlight */}
          <div
            className="absolute"
            style={{
              top: 30,
              right: 35,
              width: 15,
              height: 10,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(255,255,255,0.5), transparent)",
              filter: "blur(2px)",
            }}
          />
          {/* Eyes */}
          <div className="absolute flex gap-5" style={{ top: 50 }}>
            <div className="w-3 h-4 rounded-full bg-navy-900" style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)" }} />
            <div className="w-3 h-4 rounded-full bg-navy-900" style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)" }} />
          </div>
          {/* Mouth */}
          <div
            className="absolute"
            style={{
              top: 75,
              width: 20,
              height: 8,
              borderRadius: "0 0 50% 50%",
              border: "2px solid rgba(10, 14, 39, 0.5)",
              borderTop: "none",
            }}
          />
          {/* Evolution emoji badge */}
          <div
            className="absolute -bottom-1 text-2xl"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
          >
            {evo.emoji}
          </div>
        </div>
      </button>

      {/* Floating click text */}
      {floats.map((f) => (
        <span
          key={f.id}
          className="absolute font-bold text-lg pointer-events-none animate-float-up"
          style={{
            left: f.x,
            top: f.y,
            color: "#7ec8e3",
            textShadow: "0 0 10px rgba(126,200,227,0.8)",
          }}
        >
          +{formatNumber(f.value)}
        </span>
      ))}
    </div>
  );
}
