import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { RANDOM_EVENTS } from "../data/events";

export function useGameLoop() {
  const tick = useGameStore((s) => s.tick);
  const checkEvolution = useGameStore((s) => s.checkEvolution);
  const addEvent = useGameStore((s) => s.addEvent);
  const save = useGameStore((s) => s.save);

  const lastTickRef = useRef(performance.now());
  const lastEventRef = useRef(Date.now());
  const lastSaveRef = useRef(Date.now());

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const now = performance.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      // Passive income tick
      tick(dt);

      // Check evolution
      checkEvolution();

      // Random event every 5-10 seconds
      const nowMs = Date.now();
      if (nowMs - lastEventRef.current > 5000 + Math.random() * 5000) {
        lastEventRef.current = nowMs;
        const msg = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        addEvent(msg);
      }

      // Auto-save every 10 seconds
      if (nowMs - lastSaveRef.current > 10000) {
        lastSaveRef.current = nowMs;
        save();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tick, checkEvolution, addEvent, save]);
}
