import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { useExtraStore } from "../store/extraStore";
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
  const tickBoss = useExtraStore((s) => s.tickBoss);
  const checkDungeon = useExtraStore((s) => s.checkDungeon);
  const checkQuests = useExtraStore((s) => s.checkQuests);
  const saveExtra = useExtraStore((s) => s.saveExtra);

  const lastTickRef = useRef(performance.now());
  const lastEventRef = useRef(Date.now());
  const lastSaveRef = useRef(Date.now());
  const lastSlowRef = useRef(Date.now());
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
      tickBoss(dt);

      const nowMs = Date.now();

      // Slow checks every 2s
      if (nowMs - lastSlowRef.current > 2000) {
        lastSlowRef.current = nowMs;
        checkAchievements();
        checkChallengeCompletion();
        checkDungeon();
        checkQuests();

        // Track daily clicks
        const clicks = useGameStore.getState().totalClicks;
        useExtraStore.setState((s) => ({ dailyQuestClicks: clicks }));
      }

      // Auto-buy every second
      if (nowMs - lastAutoBuyRef.current > 1000) {
        lastAutoBuyRef.current = nowMs;
        autoBuy();
      }

      // Random magicule storm
      if (nowMs > nextStormRef.current) {
        if (!useGameStore.getState().stormActive) startStorm();
        nextStormRef.current = nowMs + 60_000 + Math.random() * 120_000;
      }

      // Random event
      if (nowMs - lastEventRef.current > 5000 + Math.random() * 5000) {
        lastEventRef.current = nowMs;
        addEvent(RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]);
      }

      // Auto-save
      if (nowMs - lastSaveRef.current > 10000) {
        lastSaveRef.current = nowMs;
        save();
        saveExtra();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tick, checkEvolution, checkAchievements, checkChallengeCompletion, autoBuy, startStorm, addEvent, save, tickBoss, checkDungeon, checkQuests, saveExtra]);
}
