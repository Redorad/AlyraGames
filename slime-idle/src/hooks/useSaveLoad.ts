import { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useExtraStore } from "../store/extraStore";
import { formatNumber, formatTime } from "../utils/format";

// Global save function — called from multiple places
export function doGlobalSave() {
  try {
    useGameStore.getState().save();
    useExtraStore.getState().saveExtra();
  } catch { /* ignore */ }
}

export function useSaveLoad() {
  const load = useGameStore((s) => s.load);
  const tick = useGameStore((s) => s.tick);
  const addEvent = useGameStore((s) => s.addEvent);
  const loadExtra = useExtraStore((s) => s.loadExtra);
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

    const onVisChange = () => {
      if (document.visibilityState === "hidden") doGlobalSave();
    };

    // Save on all possible mobile-friendly events
    window.addEventListener("beforeunload", doGlobalSave);
    window.addEventListener("pagehide", doGlobalSave);
    document.addEventListener("visibilitychange", onVisChange);

    // Fallback: setInterval auto-save every 3s — works even when RAF is throttled (iOS background)
    const intervalId = setInterval(doGlobalSave, 3000);

    // Also save on touch events (user is actively playing = save often)
    let lastTouchSave = 0;
    const onTouch = () => {
      const now = Date.now();
      if (now - lastTouchSave > 2000) { // max every 2s
        lastTouchSave = now;
        doGlobalSave();
      }
    };
    document.addEventListener("touchend", onTouch, { passive: true });

    return () => {
      window.removeEventListener("beforeunload", doGlobalSave);
      window.removeEventListener("pagehide", doGlobalSave);
      document.removeEventListener("visibilitychange", onVisChange);
      document.removeEventListener("touchend", onTouch);
      clearInterval(intervalId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissOffline = () => setOfflineData(null);

  return { offlineData, dismissOffline };
}
