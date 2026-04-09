import { useEffect, useRef } from "react";
import { Direction } from "./store";

const MIN_SWIPE = 30;

export function useSwipe(onSwipe: (d: Direction) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;

      if (Math.abs(dx) < MIN_SWIPE && Math.abs(dy) < MIN_SWIPE) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        onSwipe(dx > 0 ? "RIGHT" : "LEFT");
      } else {
        onSwipe(dy > 0 ? "DOWN" : "UP");
      }
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipe]);
}
