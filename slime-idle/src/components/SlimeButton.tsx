import { useState, useCallback, useRef, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { formatNumber } from "../utils/format";
import { EVOLUTIONS } from "../data/evolutions";

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number;
  crit: boolean;
}

export function SlimeButton() {
  const click = useGameStore((s) => s.click);
  const getClickPower = useGameStore((s) => s.getClickPower);
  const activeChallenge = useGameStore((s) => s.activeChallenge);
  const evolutionIndex = useGameStore((s) => s.evolutionIndex);
  const comboCount = useGameStore((s) => s.comboCount);
  const stormActive = useGameStore((s) => s.stormActive);
  const [bouncing, setBouncing] = useState(false);
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const nextId = useRef(0);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const evo = EVOLUTIONS[evolutionIndex];
  const clickDisabled = activeChallenge !== null && getClickPower() === 0;

  const doClick = useCallback(
    (clientX?: number, clientY?: number) => {
      if (clickDisabled) return;
      const result = click();
      setBouncing(true);
      setTimeout(() => setBouncing(false), 120);

      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const id = nextId.current++;
      const x = (clientX ?? rect.left + rect.width / 2) - rect.left + (Math.random() - 0.5) * 40;
      const y = (clientY ?? rect.top + 20) - rect.top;

      setFloats((f) => [...f.slice(-12), { id, x, y, value: result.power, crit: result.crit }]);
      setTimeout(() => setFloats((f) => f.filter((t) => t.id !== id)), 1000);
    },
    [click, clickDisabled]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      doClick(e.clientX, e.clientY);
    },
    [doClick]
  );

  // Hold-to-click: start auto-clicking on pointer down, stop on up/leave
  const startHold = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (clickDisabled) return;
      // Prevent default to avoid text selection on mobile
      e.preventDefault();
      doClick(e.clientX, e.clientY);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = setInterval(() => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        doClick(rect.left + rect.width / 2 + (Math.random() - 0.5) * 60, rect.top + rect.height / 2 + (Math.random() - 0.5) * 40);
      }, 80); // ~12 clicks per second
    },
    [doClick, clickDisabled]
  );

  const stopHold = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopHold(), [stopHold]);

  const comboMult = comboCount > 1 ? Math.min(3, 1 + (comboCount - 1) * 0.05) : 0;

  return (
    <div className="relative flex flex-col justify-center items-center py-4">
      {/* Storm indicator */}
      {stormActive && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs text-yellow-300 font-bold animate-pulse z-20">
          🌀 MAGICULE STORM 🌀
        </div>
      )}

      {/* Combo indicator */}
      {comboCount > 2 && (
        <div className="absolute top-0 right-4 text-xs font-bold text-accent z-20">
          ×{comboMult.toFixed(2)} combo ({comboCount})
        </div>
      )}

      {/* 3D glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 180,
          height: 180,
          background: stormActive
            ? "radial-gradient(circle, rgba(250,204,21,0.2) 0%, rgba(250,204,21,0.08) 50%, transparent 70%)"
            : "radial-gradient(circle, rgba(126,200,227,0.15) 0%, rgba(167,139,250,0.08) 50%, transparent 70%)",
          filter: "blur(10px)",
          animation: "pulseGlow 3s ease-in-out infinite",
        }}
      />

      <button
        ref={buttonRef}
        onClick={handleClick}
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        disabled={clickDisabled}
        className={`relative select-none cursor-pointer focus:outline-none transition-transform duration-100 touch-none
          ${clickDisabled ? "opacity-40 cursor-not-allowed" : "active:scale-90"}
          ${bouncing ? "animate-slime-bounce" : ""}`}
        aria-label="Click or hold to absorb magicules"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* 3D slime body */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 150,
            height: 150,
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            background: stormActive
              ? `radial-gradient(circle at 35% 30%, rgba(255, 250, 200, 0.9), rgba(250, 204, 21, 0.7) 40%, rgba(200, 150, 20, 0.8) 70%, rgba(140, 100, 10, 0.9))`
              : `radial-gradient(circle at 35% 30%, rgba(200, 240, 255, 0.9), rgba(126, 200, 227, 0.7) 40%, rgba(60, 120, 200, 0.8) 70%, rgba(30, 60, 140, 0.9))`,
            boxShadow: stormActive
              ? `0 8px 30px rgba(250,204,21,0.4), 0 0 60px rgba(250,204,21,0.15), inset 0 -8px 20px rgba(140,100,10,0.5), inset 0 8px 20px rgba(255,250,200,0.3)`
              : `0 8px 30px rgba(126,200,227,0.4), 0 0 60px rgba(126,200,227,0.15), inset 0 -8px 20px rgba(30,60,140,0.5), inset 0 8px 20px rgba(200,240,255,0.3)`,
          }}
        >
          {/* Highlights */}
          <div
            className="absolute"
            style={{ top: 18, left: 30, width: 40, height: 25, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.7), transparent)", filter: "blur(4px)" }}
          />
          <div
            className="absolute"
            style={{ top: 30, right: 35, width: 15, height: 10, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.5), transparent)", filter: "blur(2px)" }}
          />
          {/* Eyes */}
          <div className="absolute flex gap-5" style={{ top: 50 }}>
            <div className="w-3 h-4 rounded-full bg-navy-900" style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)" }} />
            <div className="w-3 h-4 rounded-full bg-navy-900" style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)" }} />
          </div>
          {/* Mouth */}
          <div
            className="absolute"
            style={{ top: 75, width: 20, height: 8, borderRadius: "0 0 50% 50%", border: "2px solid rgba(10,14,39,0.5)", borderTop: "none" }}
          />
          {/* Evolution badge */}
          <div className="absolute -bottom-1 text-2xl" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
            {evo.emoji}
          </div>
        </div>
      </button>

      {/* Hold hint */}
      <div className="text-[10px] text-gray-600 mt-2">tap or hold</div>

      {/* Floating texts */}
      {floats.map((f) => (
        <span
          key={f.id}
          className={`absolute font-bold pointer-events-none animate-float-up ${f.crit ? "text-xl" : "text-lg"}`}
          style={{
            left: f.x,
            top: f.y,
            color: f.crit ? "#fbbf24" : "#7ec8e3",
            textShadow: f.crit ? "0 0 15px rgba(251,191,36,0.9)" : "0 0 10px rgba(126,200,227,0.8)",
          }}
        >
          {f.crit ? "CRIT " : ""}+{formatNumber(f.value)}
        </span>
      ))}
    </div>
  );
}
