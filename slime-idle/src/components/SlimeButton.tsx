import { useState, useCallback, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { formatNumber } from "../utils/format";

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number;
}

export function SlimeButton() {
  const click = useGameStore((s) => s.click);
  const getClickPower = useGameStore((s) => s.getClickPower);
  const [bouncing, setBouncing] = useState(false);
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const nextId = useRef(0);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      click();
      setBouncing(true);
      setTimeout(() => setBouncing(false), 150);

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
      setFloats((f) => [...f, { id, x, y, value: power }]);
      setTimeout(() => {
        setFloats((f) => f.filter((t) => t.id !== id));
      }, 1000);
    },
    [click, getClickPower]
  );

  return (
    <div className="relative flex justify-center items-center py-4">
      <button
        onClick={handleClick}
        className={`relative text-8xl select-none cursor-pointer active:scale-95 transition-transform
          ${bouncing ? "animate-slime-bounce" : "animate-pulse-glow"}
          hover:scale-105 focus:outline-none`}
        aria-label="Click to absorb magicules"
      >
        <span className="drop-shadow-[0_0_15px_rgba(126,200,227,0.5)]">🫧</span>
      </button>

      {floats.map((f) => (
        <span
          key={f.id}
          className="absolute text-steel font-bold text-lg pointer-events-none animate-float-up"
          style={{ left: f.x, top: f.y }}
        >
          +{formatNumber(f.value)}
        </span>
      ))}
    </div>
  );
}
