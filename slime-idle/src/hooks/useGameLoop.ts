import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { RANDOM_EVENTS } from "../data/events";

export function useGameLoop() {
  const tick = useGameStore((s) => s.tick);
  const checkEvolution = useGameStore((s) => s.checkEvolution);
  const checkAchievements = useGameStore((s) => s.checkAchievements);
  const checkChallengeCompletion = useGameStore((s) => s.checkChallengeCompletion);
  const autoBuy = useGameStore((s) => s.autoBuy);
  const startStorm = useGameStore((s) => s.startStorm);
  const addEvent = useGameStore((s) => s.addEvent);
  const save = useGameStore((s) => s.save);

  const lastTickRef = useRef(performance.now());
  const lastEventRef = useRef(Date.now());
  const lastSaveRef = useRef(Date.now());
  const lastAchCheckRef = useRef(Date.now());
  const lastAutoBuyRef = useRef(Date.now());
  const nextStormRef = useRef(Date.now() + 60_000 + Math.random() * 120_000);

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const now = performance.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      tick(dt);
      checkEvolution();

      const nowMs = Date.now();

      // Check achievements every 2 seconds
      if (nowMs - lastAchCheckRef.current > 2000) {
        lastAchCheckRef.current = nowMs;
        checkAchievements();
        checkChallengeCompletion();
      }

      // Auto-buy every second
      if (nowMs - lastAutoBuyRef.current > 1000) {
        lastAutoBuyRef.current = nowMs;
        autoBuy();
      }

      // Random magicule storm every 1-3 minutes
      if (nowMs > nextStormRef.current) {
        const stormActive = useGameStore.getState().stormActive;
        if (!stormActive) {
          startStorm();
        }
        nextStormRef.current = nowMs + 60_000 + Math.random() * 120_000;
      }

      // Random event every 5-10 seconds
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
  }, [tick, checkEvolution, checkAchievements, checkChallengeCompletion, autoBuy, startStorm, addEvent, save]);
}
