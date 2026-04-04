import { useState, useCallback, useRef, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { useExtraStore } from "../store/extraStore";
import { formatNumber } from "../utils/format";
import { EVOLUTIONS } from "../data/evolutions";
import { playClick, playCrit } from "../utils/sounds";

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number;
  crit: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

// Evolution-based slime color palettes
const EVO_COLORS = [
  // 0: Small Slime — soft blue
  { highlight: "rgba(200,240,255,0.9)", mid: "rgba(126,200,227,0.7)", deep: "rgba(60,120,200,0.8)", dark: "rgba(30,60,140,0.9)", glow: "rgba(126,200,227,0.4)" },
  // 1: Slime — cyan
  { highlight: "rgba(180,250,255,0.9)", mid: "rgba(100,220,240,0.7)", deep: "rgba(40,150,210,0.8)", dark: "rgba(20,80,160,0.9)", glow: "rgba(100,220,240,0.4)" },
  // 2: Named Rimuru — royal blue
  { highlight: "rgba(180,210,255,0.9)", mid: "rgba(80,140,250,0.7)", deep: "rgba(50,80,220,0.8)", dark: "rgba(25,40,180,0.9)", glow: "rgba(80,140,250,0.4)" },
  // 3: Dire Slime — teal
  { highlight: "rgba(180,255,230,0.9)", mid: "rgba(60,210,180,0.7)", deep: "rgba(30,160,140,0.8)", dark: "rgba(10,100,100,0.9)", glow: "rgba(60,210,180,0.4)" },
  // 4: Tempest — electric blue
  { highlight: "rgba(220,240,255,0.9)", mid: "rgba(100,180,255,0.7)", deep: "rgba(40,100,240,0.8)", dark: "rgba(20,50,200,0.9)", glow: "rgba(100,180,255,0.5)" },
  // 5: Demon Slime — crimson/purple
  { highlight: "rgba(255,200,220,0.9)", mid: "rgba(220,80,120,0.7)", deep: "rgba(180,40,80,0.8)", dark: "rgba(120,20,60,0.9)", glow: "rgba(220,80,120,0.4)" },
  // 6: True Demon Lord — gold/red
  { highlight: "rgba(255,240,180,0.9)", mid: "rgba(250,200,60,0.7)", deep: "rgba(220,140,20,0.8)", dark: "rgba(160,80,10,0.9)", glow: "rgba(250,200,60,0.5)" },
  // 7: Ultimate Slime — radiant gold
  { highlight: "rgba(255,255,220,0.95)", mid: "rgba(255,220,100,0.8)", deep: "rgba(240,180,40,0.85)", dark: "rgba(200,130,10,0.9)", glow: "rgba(255,220,100,0.5)" },
  // 8: Chaos Creator — cosmic purple
  { highlight: "rgba(230,200,255,0.9)", mid: "rgba(160,100,240,0.7)", deep: "rgba(100,40,200,0.8)", dark: "rgba(60,20,140,0.9)", glow: "rgba(160,100,240,0.5)" },
  // 9: Void God — dark void
  { highlight: "rgba(180,180,220,0.9)", mid: "rgba(80,80,140,0.7)", deep: "rgba(40,30,100,0.8)", dark: "rgba(15,10,60,0.95)", glow: "rgba(100,80,200,0.4)" },
  // 10: Transcendent — iridescent
  { highlight: "rgba(255,220,255,0.9)", mid: "rgba(200,140,255,0.7)", deep: "rgba(120,80,240,0.8)", dark: "rgba(80,40,200,0.9)", glow: "rgba(200,140,255,0.5)" },
  // 11: Origin of All — white/prismatic
  { highlight: "rgba(255,255,255,0.95)", mid: "rgba(240,230,255,0.8)", deep: "rgba(200,180,255,0.8)", dark: "rgba(150,120,220,0.9)", glow: "rgba(240,230,255,0.6)" },
];

const STORM_COLORS = {
  highlight: "rgba(255,250,200,0.9)", mid: "rgba(250,204,21,0.7)", deep: "rgba(200,150,20,0.8)", dark: "rgba(140,100,10,0.9)", glow: "rgba(250,204,21,0.4)",
};

export function SlimeButton() {
  const click = useGameStore((s) => s.click);
  const getClickPower = useGameStore((s) => s.getClickPower);
  const activeChallenge = useGameStore((s) => s.activeChallenge);
  const evolutionIndex = useGameStore((s) => s.evolutionIndex);
  const comboCount = useGameStore((s) => s.comboCount);
  const stormActive = useGameStore((s) => s.stormActive);
  const soundEnabled = useExtraStore((s) => s.soundEnabled);
  const [bouncing, setBouncing] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const evo = EVOLUTIONS[evolutionIndex];
  const clickDisabled = activeChallenge !== null && getClickPower() === 0;
  const colors = stormActive ? STORM_COLORS : (EVO_COLORS[evolutionIndex] ?? EVO_COLORS[0]);

  const doClick = useCallback(
    (clientX?: number, clientY?: number) => {
      if (clickDisabled) return;
      const result = click();
      if (soundEnabled) { result.crit ? playCrit() : playClick(); }
      setBouncing(true);
      setTimeout(() => setBouncing(false), 120);

      // Crit shake
      if (result.crit) {
        setShaking(true);
        setTimeout(() => setShaking(false), 300);
      }

      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (clientX ?? rect.left + rect.width / 2) - rect.left + (Math.random() - 0.5) * 40;
      const y = (clientY ?? rect.top + 20) - rect.top;

      // Floating text
      const id = nextId.current++;
      setFloats((f) => [...f.slice(-12), { id, x, y, value: result.power, crit: result.crit }]);
      setTimeout(() => setFloats((f) => f.filter((t) => t.id !== id)), 1000);

      // Ripple
      const rippleId = nextId.current++;
      const rx = (clientX ?? rect.left + rect.width / 2) - rect.left;
      const ry = (clientY ?? rect.top + rect.height / 2) - rect.top;
      setRipples((r) => [...r.slice(-4), { id: rippleId, x: rx, y: ry }]);
      setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== rippleId)), 600);
    },
    [click, clickDisabled, soundEnabled]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      doClick(e.clientX, e.clientY);
    },
    [doClick]
  );

  const startHold = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (clickDisabled) return;
      e.preventDefault();
      doClick(e.clientX, e.clientY);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = setInterval(() => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        doClick(rect.left + rect.width / 2 + (Math.random() - 0.5) * 60, rect.top + rect.height / 2 + (Math.random() - 0.5) * 40);
      }, 80);
    },
    [doClick, clickDisabled]
  );

  const stopHold = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  useEffect(() => () => stopHold(), [stopHold]);

  const comboMult = comboCount > 1 ? Math.min(3, 1 + (comboCount - 1) * 0.05) : 0;

  return (
    <div className={`relative flex flex-col justify-center items-center py-4 ${shaking ? "animate-shake" : ""}`}>
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
          background: `radial-gradient(circle, ${colors.glow} 0%, ${colors.glow.replace("0.4", "0.1").replace("0.5", "0.12").replace("0.6", "0.15")} 50%, transparent 70%)`,
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
          ${bouncing ? "animate-slime-bounce" : "animate-slime-breathe"}`}
        aria-label="Click or hold to absorb magicules"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* Ripple effects */}
        {ripples.map((r) => (
          <div
            key={r.id}
            className="absolute rounded-full animate-ripple pointer-events-none"
            style={{
              left: r.x - 20,
              top: r.y - 20,
              width: 40,
              height: 40,
              border: `2px solid ${colors.mid}`,
            }}
          />
        ))}

        {/* 3D slime body */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 150,
            height: 150,
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            background: `radial-gradient(circle at 35% 30%, ${colors.highlight}, ${colors.mid} 40%, ${colors.deep} 70%, ${colors.dark})`,
            boxShadow: `0 8px 30px ${colors.glow}, 0 0 60px ${colors.glow.replace("0.4", "0.15").replace("0.5", "0.15").replace("0.6", "0.15")}, inset 0 -8px 20px ${colors.dark}, inset 0 8px 20px ${colors.highlight}`,
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
          {/* Eyes — animated by state */}
          <div className="absolute flex gap-5 transition-all duration-200" style={{ top: 50 }}>
            {stormActive ? (
              <>
                <div className="w-3.5 h-2.5 rounded-full bg-navy-900" style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)", transform: "skewY(-8deg)" }} />
                <div className="w-3.5 h-2.5 rounded-full bg-navy-900" style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)", transform: "skewY(8deg)" }} />
              </>
            ) : bouncing ? (
              <>
                <div className="w-3 h-1.5 rounded-full bg-navy-900" style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)" }} />
                <div className="w-3 h-1.5 rounded-full bg-navy-900" style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)" }} />
              </>
            ) : (
              <>
                <div className="w-3 h-4 rounded-full bg-navy-900" style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)" }} />
                <div className="w-3 h-4 rounded-full bg-navy-900" style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)" }} />
              </>
            )}
          </div>
          {/* Mouth */}
          <div
            className="absolute transition-all duration-200"
            style={stormActive
              ? { top: 75, width: 14, height: 6, borderRadius: "50%", background: "rgba(10,14,39,0.5)" }
              : bouncing
              ? { top: 73, width: 24, height: 12, borderRadius: "0 0 50% 50%", border: "2px solid rgba(10,14,39,0.5)", borderTop: "none" }
              : { top: 75, width: 20, height: 8, borderRadius: "0 0 50% 50%", border: "2px solid rgba(10,14,39,0.5)", borderTop: "none" }
            }
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
            color: f.crit ? "#fbbf24" : colors.mid.replace(/,[\d.]+\)$/, ",1)"),
            textShadow: f.crit ? "0 0 15px rgba(251,191,36,0.9)" : `0 0 10px ${colors.glow}`,
          }}
        >
          {f.crit ? "CRIT " : ""}+{formatNumber(f.value)}
        </span>
      ))}
    </div>
  );
}
