import { useState, useCallback, useRef, useEffect } from "react";
import { useExtraStore } from "../store/extraStore";
import { useGameStore } from "../store/gameStore";
import { BOSSES } from "../data/bosses";
import { formatNumber } from "../utils/format";
import { playBossHit, playBossVictory, playBossDefeat } from "../utils/sounds";

export function BossPanel() {
  const [open, setOpen] = useState(false);
  const activeBoss = useExtraStore((s) => s.activeBoss);
  const bossesDefeated = useExtraStore((s) => s.bossesDefeated);
  const bossCooldownEnd = useExtraStore((s) => s.bossCooldownEnd);
  const startBoss = useExtraStore((s) => s.startBoss);
  const hitBoss = useExtraStore((s) => s.hitBoss);
  const soundEnabled = useExtraStore((s) => s.soundEnabled);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doHit = useCallback(() => {
    const result = hitBoss();
    if (result.defeated) {
      if (soundEnabled) playBossVictory();
    } else if (result.damage > 0) {
      if (soundEnabled) playBossHit();
    }
  }, [hitBoss, soundEnabled]);

  const startHold = useCallback(() => {
    doHit();
    holdRef.current = setInterval(doHit, 80);
  }, [doHit]);

  const stopHold = useCallback(() => {
    if (holdRef.current) { clearInterval(holdRef.current); holdRef.current = null; }
  }, []);

  useEffect(() => () => stopHold(), [stopHold]);

  const boss = activeBoss ? BOSSES.find((b) => b.id === activeBoss.bossId) : null;
  const onCooldown = Date.now() < bossCooldownEnd;

  // Active boss fight view
  if (activeBoss && boss) {
    const hpPct = (activeBoss.hpRemaining / activeBoss.maxHp) * 100;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="bg-navy-800 border border-red-500/40 rounded-xl p-5 max-w-sm w-full text-center">
          <div className="text-3xl mb-2">{boss.emoji}</div>
          <h2 className="text-red-400 font-bold text-lg">{boss.name}</h2>
          <p className="text-xs text-gray-400 mb-3">{boss.description}</p>

          {/* HP bar */}
          <div className="w-full h-4 bg-navy-700 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-100"
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-3">
            <span>HP: {formatNumber(activeBoss.hpRemaining)}/{formatNumber(activeBoss.maxHp)}</span>
            <span className="text-red-400">{Math.ceil(activeBoss.timeRemaining)}s</span>
          </div>

          {/* Attack button */}
          <button
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onPointerCancel={stopHold}
            className="w-full py-4 bg-red-600/80 text-white rounded-xl text-lg font-bold active:scale-95 transition-transform touch-none select-none"
          >
            ⚔️ ATTACK (hold)
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1">
        ⚔️ Bosses
      </button>
    );
  }

  const availableBosses = BOSSES.filter((b) => b.unlockPrestige <= prestigeCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-800 border border-steel/30 rounded-xl p-4 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="text-red-400 font-bold mb-3">⚔️ Boss Fights</h2>
        {onCooldown && (
          <p className="text-xs text-yellow-400 mb-2">Cooldown active...</p>
        )}
        <div className="flex-1 overflow-y-auto space-y-2">
          {availableBosses.map((boss) => {
            const defeated = bossesDefeated.includes(boss.id);
            return (
              <div key={boss.id} className={`p-3 rounded-lg border ${defeated ? "border-green-500/30 bg-green-900/10" : "border-red-500/20 bg-navy-900/30"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white text-sm">
                    {boss.emoji} {boss.name} {defeated && <span className="text-green-400">✓</span>}
                  </span>
                  <span className="text-xs text-gray-500">HP: {formatNumber(boss.hp)}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{boss.description} | {boss.timeLimit}s limit | {Math.round(boss.reward.artifactChance * 100)}% artifact</p>
                <button
                  onClick={() => { startBoss(boss); }}
                  disabled={onCooldown}
                  className={`text-xs px-3 py-1 rounded ${onCooldown ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30"}`}
                >
                  {defeated ? "Fight Again" : "Challenge"}
                </button>
              </div>
            );
          })}
          {availableBosses.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">Prestige to unlock boss fights!</p>
          )}
        </div>
        <button onClick={() => setOpen(false)} className="mt-3 w-full py-2 bg-navy-700 text-gray-300 rounded-lg text-sm border border-steel/20">Close</button>
      </div>
    </div>
  );
}
