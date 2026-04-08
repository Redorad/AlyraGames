import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { ENEMY_ROUNDS } from '../data/enemies';
import { BattleUnit, DamageEvent, DeathEvent, HealEvent } from '../types';
import { playHit, playCrit, playDeath, playVictory, playDefeat } from '../utils/sounds';

interface AnimatedUnit {
  uid: string;
  emoji: string;
  name: string;
  side: 'player' | 'enemy';
  maxHp: number;
  currentHp: number;
  alive: boolean;
  shaking: boolean;
  x: number;
  y: number;
  burn: number;
  poison: number;
  stun: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  isCrit: boolean;
}

export default function BattleScreen() {
  const { battleLog, round, endBattle, playerTeam, enemyTeam } = useGameStore();
  const [animUnits, setAnimUnits] = useState<AnimatedUnit[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [currentTick, setCurrentTick] = useState(-1);
  const [battleDone, setBattleDone] = useState(false);
  const tickRef = useRef(0);
  const floatIdRef = useRef(0);
  const animFrameRef = useRef(0);

  const enemyRound = ENEMY_ROUNDS.find(r => r.round === round);

  // Init animated units
  useEffect(() => {
    const units: AnimatedUnit[] = [];

    playerTeam.forEach((u: BattleUnit, i: number) => {
      units.push({
        uid: u.uid,
        emoji: u.def.emoji,
        name: u.def.name,
        side: 'player',
        maxHp: u.maxHp,
        currentHp: u.maxHp,
        alive: true,
        shaking: false,
        x: 80 + (i % 4) * 90,
        y: 260 + Math.floor(i / 4) * 80,
        burn: 0,
        poison: 0,
        stun: 0,
      });
    });

    enemyTeam.forEach((u: BattleUnit, i: number) => {
      units.push({
        uid: u.uid,
        emoji: u.def.emoji,
        name: u.def.name,
        side: 'enemy',
        maxHp: u.maxHp,
        currentHp: u.maxHp,
        alive: true,
        shaking: false,
        x: 80 + (i % 4) * 90,
        y: 40 + Math.floor(i / 4) * 80,
        burn: 0,
        poison: 0,
        stun: 0,
      });
    });

    setAnimUnits(units);
    setCurrentTick(-1);
    setBattleDone(false);
    tickRef.current = 0;
  }, [playerTeam, enemyTeam]);

  const processTick = useCallback(() => {
    if (!battleLog) return;

    const tick = tickRef.current;
    const tickDamages = battleLog.damages.filter((d: DamageEvent) => d.tick === tick);
    const tickDeaths = battleLog.deaths.filter((d: DeathEvent) => d.tick === tick);
    const tickHeals = battleLog.heals.filter((h: HealEvent) => h.tick === tick);

    if (tickDamages.length === 0 && tickDeaths.length === 0 && tickHeals.length === 0) {
      // No more events at this tick or beyond
      const maxTick = Math.max(
        ...battleLog.damages.map((d: DamageEvent) => d.tick),
        ...battleLog.deaths.map((d: DeathEvent) => d.tick),
        ...battleLog.heals.map((h: HealEvent) => h.tick),
        0
      );
      if (tick > maxTick) {
        setBattleDone(true);
        if (battleLog.winner === 'player') {
          playVictory();
        } else {
          playDefeat();
        }
        return;
      }
    }

    setCurrentTick(tick);

    // Apply damage and heal events
    setAnimUnits(prev => {
      const next = prev.map(u => ({ ...u, shaking: false }));

      for (const dmgEvt of tickDamages) {
        const target = next.find(u => u.uid === dmgEvt.targetUid);
        if (target) {
          target.currentHp = Math.max(0, target.currentHp - dmgEvt.damage);
          target.shaking = true;

          if (dmgEvt.isCrit) {
            playCrit();
          } else {
            playHit();
          }

          // Floating damage
          const fid = ++floatIdRef.current;
          // Self-damage (burn/poison) shows differently
          const isSelfDmg = dmgEvt.attackerUid === dmgEvt.targetUid;
          setFloatingTexts(prev2 => [
            ...prev2,
            {
              id: fid,
              x: target.x + Math.random() * 30 - 15,
              y: target.y - 10,
              text: `-${dmgEvt.damage}${dmgEvt.isCrit ? '!' : ''}`,
              color: isSelfDmg ? 'text-orange-400' : (dmgEvt.isCrit ? 'text-yellow-400' : 'text-red-400'),
              isCrit: dmgEvt.isCrit,
            },
          ]);

          // Remove floating text after animation
          setTimeout(() => {
            setFloatingTexts(prev2 => prev2.filter(f => f.id !== fid));
          }, 800);
        }
      }

      // Process heals
      for (const healEvt of tickHeals) {
        const target = next.find(u => u.uid === healEvt.targetUid);
        if (target) {
          target.currentHp = Math.min(target.maxHp, target.currentHp + healEvt.amount);

          const fid = ++floatIdRef.current;
          setFloatingTexts(prev2 => [
            ...prev2,
            {
              id: fid,
              x: target.x + Math.random() * 30 - 15,
              y: target.y - 10,
              text: `+${healEvt.amount}`,
              color: 'text-green-400',
              isCrit: false,
            },
          ]);

          setTimeout(() => {
            setFloatingTexts(prev2 => prev2.filter(f => f.id !== fid));
          }, 800);
        }
      }

      for (const deathEvt of tickDeaths) {
        const unit = next.find(u => u.uid === deathEvt.uid);
        if (unit) {
          unit.alive = false;
          unit.currentHp = 0;
          playDeath();
        }
      }

      return next;
    });

    tickRef.current++;
  }, [battleLog]);

  // Auto-play battle ticks
  useEffect(() => {
    if (animUnits.length === 0 || battleDone) return;

    const interval = setInterval(() => {
      processTick();
    }, 600);

    return () => clearInterval(interval);
  }, [animUnits.length, battleDone, processTick]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="h-full flex flex-col text-white p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <span className="text-lg font-bold text-accent">Round {round}/10 - Combat</span>
        <span className="text-sm text-gray-400">
          vs <span className="text-red-400">{enemyRound?.name}</span>
        </span>
        <div className="px-3 py-1 rounded-lg bg-navy-700 border border-accent/40">
          <span className="text-sm font-bold text-accent">Tick {currentTick + 1}</span>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="flex-1 relative bg-navy-800/50 rounded-xl border border-gray-700 overflow-hidden min-h-0">
        {/* Labels */}
        <div className="absolute top-2 left-3 text-xs text-red-400 font-bold">ENNEMIS</div>
        <div className="absolute bottom-2 left-3 text-xs text-blue-400 font-bold">VOTRE EQUIPE</div>

        {/* Divider */}
        <div className="absolute left-0 right-0 top-1/2 border-t border-gray-700/50 border-dashed" />

        {/* Units */}
        {animUnits.map(unit => (
          <div
            key={unit.uid}
            className={`absolute transition-all duration-300 flex flex-col items-center
              ${!unit.alive ? 'opacity-20 scale-75' : ''}
              ${unit.shaking ? 'animate-shake' : ''}
            `}
            style={{ left: unit.x, top: unit.y }}
          >
            <span className="text-3xl">{unit.emoji}</span>
            {/* Status effect icons */}
            {unit.alive && (unit.burn > 0 || unit.poison > 0 || unit.stun > 0) && (
              <div className="flex gap-0.5 text-xs">
                {unit.burn > 0 && <span title={`Brûlure (${unit.burn})`}>🔥</span>}
                {unit.poison > 0 && <span title={`Poison (${unit.poison})`}>☠️</span>}
                {unit.stun > 0 && <span title={`Étourdi (${unit.stun})`}>💫</span>}
              </div>
            )}
            <span className="text-[9px] font-bold">{unit.name}</span>
            {/* HP bar */}
            <div className="w-14 h-1.5 bg-gray-700 rounded-full mt-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  unit.side === 'player' ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(0, (unit.currentHp / unit.maxHp) * 100)}%` }}
              />
            </div>
            <span className="text-[8px] text-gray-400">
              {unit.currentHp}/{unit.maxHp}
            </span>
          </div>
        ))}

        {/* Floating text (damage and heals) */}
        {floatingTexts.map(f => (
          <div
            key={f.id}
            className={`absolute animate-fade-up font-bold pointer-events-none
              ${f.color} ${f.isCrit ? 'text-lg' : 'text-sm'}
            `}
            style={{ left: f.x, top: f.y }}
          >
            {f.text}
          </div>
        ))}
      </div>

      {/* Result overlay */}
      {battleDone && battleLog && (
        <div className="mt-3 flex flex-col items-center flex-shrink-0">
          <div className={`text-3xl font-bold mb-2 ${
            battleLog.winner === 'player' ? 'text-green-400' : 'text-red-400'
          }`}>
            {battleLog.winner === 'player' ? '🎉 Victoire !' : '💀 Défaite...'}
          </div>
          {battleLog.winner === 'enemy' && (
            <div className="text-sm text-red-300 mb-2">
              {battleLog.survivingEnemies} ennemi(s) restant(s) — Vous perdez {battleLog.survivingEnemies * 10} PV
            </div>
          )}
          <button
            onClick={endBattle}
            className="px-8 py-2 bg-accent/20 border-2 border-accent rounded-xl text-accent font-bold
                       hover:bg-accent/30 transition-all"
          >
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}
