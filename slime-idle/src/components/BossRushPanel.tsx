import { useState, useCallback, useRef, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { formatNumber } from "../utils/format";

const STORAGE_KEY = "slime-idle-bossrush";
const EQUIP_KEY = "slime-idle-equipment";
const TIME_LIMIT = 30; // seconds per wave

interface RushState {
  highestWave: number;
  activeRush: {
    wave: number;
    hpRemaining: number;
    maxHp: number;
    startTime: number;
  } | null;
}

function loadRushState(): RushState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { highestWave: 0, activeRush: null };
}

function saveRushState(state: RushState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bossHp(wave: number): number {
  return 100 * Math.pow(1.5, wave);
}

const WAVE_DROPS: { wave: number; itemId: string; label: string }[] = [
  { wave: 10, itemId: "eq_storm_fang", label: "Storm Fang" },
  { wave: 20, itemId: "eq_creation_jewel", label: "Creation Jewel" },
  { wave: 25, itemId: "eq_void_blade", label: "Void Blade" },
  { wave: 30, itemId: "eq_origin_robe", label: "Origin Robe" },
];

function tryAwardEquipment(itemId: string) {
  try {
    const raw = localStorage.getItem(EQUIP_KEY);
    const data = raw ? JSON.parse(raw) : { inventory: [], equipped: {} };
    if (!Array.isArray(data.inventory)) data.inventory = [];
    if (!data.inventory.includes(itemId)) {
      data.inventory.push(itemId);
      localStorage.setItem(EQUIP_KEY, JSON.stringify(data));
    }
  } catch { /* ignore corrupted data */ }
}

export function BossRushPanel() {
  const [open, setOpen] = useState(false);
  const [rush, setRush] = useState<RushState>(loadRushState);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rushRef = useRef(rush);
  rushRef.current = rush;

  // Persist on rush changes
  useEffect(() => {
    saveRushState(rush);
  }, [rush]);

  // Timer tick for active rush
  useEffect(() => {
    if (!rush.activeRush) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      const r = rushRef.current;
      if (!r.activeRush) return;
      const elapsed = (Date.now() - r.activeRush.startTime) / 1000;
      const remaining = Math.max(0, TIME_LIMIT - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        endRush(r);
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rush.activeRush !== null]);

  const endRush = useCallback((state: RushState) => {
    const wave = state.activeRush?.wave ?? 0;
    const passivePower = useGameStore.getState().getPassivePower();
    const reward = wave * passivePower * 10;

    // Award magicules
    if (reward > 0) {
      useGameStore.setState((s) => ({
        magicules: s.magicules + reward,
        lifetimeMagicules: s.lifetimeMagicules + reward,
      }));
      useGameStore.getState().addEvent(
        `Boss Rush ended at wave ${wave}! Earned ${formatNumber(reward)} magicules.`
      );
    }

    setRush((prev) => ({
      highestWave: Math.max(prev.highestWave, wave),
      activeRush: null,
    }));
    setTimeLeft(TIME_LIMIT);
    stopHold();
  }, []);

  const startRush = useCallback(() => {
    const wave = 1;
    const maxHp = bossHp(wave);
    setRush((prev) => ({
      ...prev,
      activeRush: {
        wave,
        hpRemaining: maxHp,
        maxHp,
        startTime: Date.now(),
      },
    }));
    setTimeLeft(TIME_LIMIT);
  }, []);

  const advanceWave = useCallback((currentWave: number) => {
    // Check equipment drops for the wave just completed
    for (const drop of WAVE_DROPS) {
      if (currentWave === drop.wave) {
        tryAwardEquipment(drop.itemId);
        useGameStore.getState().addEvent(
          `Boss Rush: Found ${drop.label} at wave ${drop.wave}!`
        );
      }
    }

    const nextWave = currentWave + 1;
    const maxHp = bossHp(nextWave);
    setRush((prev) => ({
      ...prev,
      highestWave: Math.max(prev.highestWave, currentWave),
      activeRush: {
        wave: nextWave,
        hpRemaining: maxHp,
        maxHp,
        startTime: Date.now(),
      },
    }));
    setTimeLeft(TIME_LIMIT);
  }, []);

  const doHit = useCallback(() => {
    setRush((prev) => {
      if (!prev.activeRush) return prev;
      const clickPower = useGameStore.getState().getClickPower();
      const comboMult = useGameStore.getState().getComboMultiplier();
      const damage = clickPower * 0.01 * comboMult;
      const newHp = prev.activeRush.hpRemaining - damage;

      if (newHp <= 0) {
        // Boss defeated -- advance handled separately to avoid nested setState
        setTimeout(() => advanceWave(prev.activeRush!.wave), 0);
        return {
          ...prev,
          activeRush: { ...prev.activeRush, hpRemaining: 0 },
        };
      }

      return {
        ...prev,
        activeRush: { ...prev.activeRush, hpRemaining: newHp },
      };
    });
  }, [advanceWave]);

  const startHold = useCallback(() => {
    doHit();
    holdRef.current = setInterval(doHit, 80);
  }, [doHit]);

  const stopHold = useCallback(() => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
  }, []);

  useEffect(() => () => stopHold(), [stopHold]);

  // Active rush fight view
  if (rush.activeRush) {
    const { wave, hpRemaining, maxHp } = rush.activeRush;
    const hpPct = Math.max(0, (hpRemaining / maxHp) * 100);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="glass border border-orange-500/40 rounded-xl p-5 max-w-sm w-full text-center">
          <div className="text-3xl mb-1">👹</div>
          <h2 className="text-orange-400 font-bold text-lg">Boss Rush - Wave {wave}</h2>
          <p className="text-xs text-gray-400 mb-1">Record: Wave {rush.highestWave}</p>

          {/* HP bar */}
          <div className="w-full h-4 bg-navy-700 rounded-full overflow-hidden mb-1 mt-3">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-red-400 rounded-full transition-all duration-100"
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>HP: {formatNumber(hpRemaining)}/{formatNumber(maxHp)}</span>
            <span className={`font-bold ${timeLeft < 10 ? "text-red-400" : "text-orange-400"}`}>
              {Math.ceil(timeLeft)}s
            </span>
          </div>

          {/* Time bar */}
          <div className="w-full h-1.5 bg-navy-700 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-100 ${timeLeft < 10 ? "bg-red-500" : "bg-orange-500"}`}
              style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
            />
          </div>

          {/* Attack button */}
          <button
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onPointerCancel={stopHold}
            className="w-full py-4 bg-orange-600/80 text-white rounded-xl text-lg font-bold active:scale-95 transition-transform touch-none select-none"
          >
            ⚔️ ATTACK (hold)
          </button>

          <button
            onClick={() => endRush(rushRef.current)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-300"
          >
            Retreat
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1">
        ⚡ Boss Rush
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass border border-orange-500/30 rounded-xl p-4 max-w-sm w-full text-center">
        <h2 className="text-orange-400 font-bold mb-2">⚡ Boss Rush</h2>
        <p className="text-xs text-gray-400 mb-4">
          Endless survival mode. Defeat bosses in sequence. Each wave gets harder.
          30 seconds per boss. Earn magicules based on your highest wave!
        </p>

        <div className="mb-4 p-3 rounded-lg border border-orange-500/20 bg-navy-900/40">
          <p className="text-sm text-orange-300 font-bold">
            🏆 Highest Wave: {rush.highestWave}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Wave 1 HP: {formatNumber(bossHp(1))} | HP scales x1.5 per wave
          </p>
        </div>

        <div className="text-xs text-gray-500 mb-3 space-y-0.5">
          <p className="text-gray-400 font-semibold mb-1">Equipment Drops:</p>
          {WAVE_DROPS.map((d) => (
            <p key={d.itemId}>
              Wave {d.wave}: <span className="text-orange-300">{d.label}</span>
            </p>
          ))}
        </div>

        <button
          onClick={startRush}
          className="w-full py-3 bg-orange-600/20 text-orange-400 rounded-xl text-sm font-bold border border-orange-500/40 hover:bg-orange-600/30 transition-colors"
        >
          ⚡ Start Boss Rush
        </button>

        <button
          onClick={() => setOpen(false)}
          className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm border border-steel/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
