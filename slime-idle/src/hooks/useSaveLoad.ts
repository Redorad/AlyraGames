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
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);

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
        const msg = `Welcome back! You earned ${formatNumber(earned)} magicules while away (${formatTime(result.offlineSeconds)}).`;
        addEvent(msg);
        setOfflineMessage(msg);
        setTimeout(() => setOfflineMessage(null), 5000);
      }
    }

    const handleUnload = () => { save(); saveExtra(); };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { offlineMessage };
}
