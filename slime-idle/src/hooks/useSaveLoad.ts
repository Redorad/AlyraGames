import { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useExtraStore } from "../store/extraStore";
import { formatNumber, formatTime } from "../utils/format";

export function useSaveLoad() {
  const load = useGameStore((s) => s.load);
  const save = useGameStore((s) => s.save);
  const tick = useGameStore((s) => s.tick);
  const addEvent = useGameStore((s) => s.addEvent);
  const loadExtra = useExtraStore((s) => s.loadExtra);
  const saveExtra = useExtraStore((s) => s.saveExtra);
  const checkDailyLogin = useExtraStore((s) => s.checkDailyLogin);
  const [offlineData, setOfflineData] = useState<{ seconds: number; earned: number } | null>(null);

  useEffect(() => {
    const result = load();
    loadExtra();
    checkDailyLogin();

    if (result && result.offlineSeconds > 10) {
      const state = useGameStore.getState();
      const passivePower = state.getPassivePower();
      const offlineMult = state.getOfflineMultiplier();
      const earned = passivePower * result.offlineSeconds * offlineMult;
      if (earned > 0) {
        tick(result.offlineSeconds * offlineMult);
        addEvent(`Welcome back! Earned ${formatNumber(earned)} magicules while away (${formatTime(result.offlineSeconds)}).`);
        setOfflineData({ seconds: result.offlineSeconds, earned });
      }
    }

    // Save on all possible mobile-friendly events
    const doSave = () => {
      useGameStore.getState().save();
      useExtraStore.getState().saveExtra();
    };

    window.addEventListener("beforeunload", doSave);
    window.addEventListener("pagehide", doSave);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") doSave();
    });

    return () => {
      window.removeEventListener("beforeunload", doSave);
      window.removeEventListener("pagehide", doSave);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissOffline = () => setOfflineData(null);

  return { offlineData, dismissOffline };
}
