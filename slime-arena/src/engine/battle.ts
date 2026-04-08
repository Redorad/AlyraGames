import { BattleUnit, BattleLog, DamageEvent, DeathEvent, HealEvent, UnitDef, PlacedUnit } from '../types';
import { getUnitDef } from '../data/units';
import { SYNERGIES } from '../data/synergies';

let uidCounter = 0;
function genUid(prefix: string): string {
  return `${prefix}_${++uidCounter}`;
}

function computeSynergyBonuses(units: { def: UnitDef }[]): { atk: number; hp: number; crit: number; speed: number } {
  const counts: Record<string, number> = {};
  for (const u of units) {
    for (const s of u.def.synergies) {
      counts[s] = (counts[s] || 0) + 1;
    }
  }
  let atk = 0, hp = 0, crit = 0, speed = 0;
  for (const syn of SYNERGIES) {
    if ((counts[syn.id] || 0) >= syn.threshold) {
      atk += syn.effect.atk || 0;
      hp += syn.effect.hp || 0;
      crit += syn.effect.crit || 0;
      speed += syn.effect.speed || 0;
    }
  }
  return { atk, hp, crit, speed };
}

/** Only apply synergy bonuses to units that have the matching synergy tag */
function computePerUnitSynergyBonuses(
  unit: UnitDef,
  teamCounts: Record<string, number>
): { atk: number; hp: number; crit: number; speed: number } {
  let atk = 0, hp = 0, crit = 0, speed = 0;
  for (const syn of SYNERGIES) {
    // The synergy is active if the team threshold is met
    if ((teamCounts[syn.id] || 0) >= syn.threshold) {
      // For rapide/demon/guerisseur, only apply to units with the tag
      if (['rapide', 'demon', 'guerisseur'].includes(syn.id)) {
        if (unit.synergies.includes(syn.id)) {
          atk += syn.effect.atk || 0;
          hp += syn.effect.hp || 0;
          crit += syn.effect.crit || 0;
          speed += syn.effect.speed || 0;
        }
      } else {
        // Original synergies (ogre, kijin, monster) apply to all team members
        atk += syn.effect.atk || 0;
        hp += syn.effect.hp || 0;
        crit += syn.effect.crit || 0;
        speed += syn.effect.speed || 0;
      }
    }
  }
  return { atk, hp, crit, speed };
}

function getTeamCounts(units: { def: UnitDef }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const u of units) {
    for (const s of u.def.synergies) {
      counts[s] = (counts[s] || 0) + 1;
    }
  }
  return counts;
}

export function getActiveSynergies(units: PlacedUnit[]): { id: string; count: number; active: boolean }[] {
  const counts: Record<string, number> = {};
  for (const u of units) {
    const def = getUnitDef(u.defId);
    for (const s of def.synergies) {
      counts[s] = (counts[s] || 0) + 1;
    }
  }
  return SYNERGIES.map(syn => ({
    id: syn.id,
    count: counts[syn.id] || 0,
    active: (counts[syn.id] || 0) >= syn.threshold,
  }));
}

export function buildBattleUnits(
  playerUnits: PlacedUnit[],
  enemyUnits: { id: string; gridX: number; gridY: number }[]
): { playerTeam: BattleUnit[]; enemyTeam: BattleUnit[] } {
  const playerDefs = playerUnits.map(u => ({ def: getUnitDef(u.defId) }));
  const enemyDefs = enemyUnits.map(u => ({ def: getUnitDef(u.id) }));

  const playerCounts = getTeamCounts(playerDefs);
  const enemyCounts = getTeamCounts(enemyDefs);

  const playerTeam: BattleUnit[] = playerUnits.map(u => {
    const def = getUnitDef(u.defId);
    const bonuses = computePerUnitSynergyBonuses(def, playerCounts);
    const maxHp = def.hp + bonuses.hp;
    return {
      uid: genUid('p'),
      def,
      currentHp: maxHp,
      maxHp,
      atk: def.atk + bonuses.atk,
      defStat: def.def,
      speed: def.speed + bonuses.speed,
      gridX: u.gridX,
      gridY: u.gridY,
      side: 'player' as const,
      alive: true,
      synergyBonuses: { atk: bonuses.atk, hp: bonuses.hp, crit: bonuses.crit },
      burn: 0,
      poison: 0,
      stun: 0,
    };
  });

  const enemyTeam: BattleUnit[] = enemyUnits.map(u => {
    const def = getUnitDef(u.id);
    const bonuses = computePerUnitSynergyBonuses(def, enemyCounts);
    const maxHp = def.hp + bonuses.hp;
    return {
      uid: genUid('e'),
      def,
      currentHp: maxHp,
      maxHp,
      atk: def.atk + bonuses.atk,
      defStat: def.def,
      speed: def.speed + bonuses.speed,
      gridX: u.gridX,
      gridY: u.gridY,
      side: 'enemy' as const,
      alive: true,
      synergyBonuses: { atk: bonuses.atk, hp: bonuses.hp, crit: bonuses.crit },
      burn: 0,
      poison: 0,
      stun: 0,
    };
  });

  return { playerTeam, enemyTeam };
}

function pickTarget(attacker: BattleUnit, enemies: BattleUnit[]): BattleUnit | null {
  const alive = enemies.filter(e => e.alive);
  if (alive.length === 0) return null;

  // Geld taunt: if a tank with taunt exists, target it
  const taunter = alive.find(e => e.def.id === 'geld');
  if (taunter) return taunter;

  // Souei: target weakest
  if (attacker.def.id === 'souei') {
    return alive.reduce((min, e) => e.currentHp < min.currentHp ? e : min, alive[0]);
  }

  // Default: target closest by grid (or random)
  return alive[Math.floor(Math.random() * alive.length)];
}

export function simulateBattle(
  playerTeam: BattleUnit[],
  enemyTeam: BattleUnit[]
): BattleLog {
  const allUnits = [...playerTeam, ...enemyTeam];
  const damages: DamageEvent[] = [];
  const deaths: DeathEvent[] = [];
  const heals: HealEvent[] = [];

  // Sort by speed descending
  allUnits.sort((a, b) => b.speed - a.speed);

  // --- Direwolf pack bonus: one-time ATK boost at battle start ---
  for (const unit of allUnits) {
    if (unit.def.id === 'direwolf') {
      const allies = (unit.side === 'player' ? playerTeam : enemyTeam);
      const hasWolf = allies.some(a => a.uid !== unit.uid &&
        (a.def.id === 'direwolf' || a.def.id === 'ranga'));
      if (hasWolf) {
        unit.atk += 5;
      }
    }
  }

  // --- Rimuru Predator: copy highest ATK enemy's ATK value ---
  for (const unit of allUnits) {
    if (unit.def.id === 'rimuru') {
      const enemies = unit.side === 'player' ? enemyTeam : playerTeam;
      if (enemies.length > 0) {
        const highestAtk = enemies.reduce((max, e) => e.atk > max.atk ? e : max, enemies[0]);
        unit.atk = Math.max(unit.atk, highestAtk.atk);
      }
    }
  }

  const MAX_TICKS = 100;
  let tick = 0;

  while (tick < MAX_TICKS) {
    const playersAlive = playerTeam.filter(u => u.alive);
    const enemiesAlive = enemyTeam.filter(u => u.alive);

    if (playersAlive.length === 0 || enemiesAlive.length === 0) break;

    for (const unit of allUnits) {
      if (!unit.alive) continue;

      // --- Process status effects at start of turn ---
      // Burn damage
      if (unit.burn > 0) {
        const burnDmg = 5;
        unit.currentHp -= burnDmg;
        damages.push({ attackerUid: unit.uid, targetUid: unit.uid, damage: burnDmg, isCrit: false, tick });
        unit.burn--;
        if (unit.currentHp <= 0) {
          unit.currentHp = 0;
          unit.alive = false;
          deaths.push({ uid: unit.uid, tick });
          continue;
        }
      }

      // Poison damage
      if (unit.poison > 0) {
        const poisonDmg = 3;
        unit.currentHp -= poisonDmg;
        damages.push({ attackerUid: unit.uid, targetUid: unit.uid, damage: poisonDmg, isCrit: false, tick });
        unit.poison--;
        if (unit.currentHp <= 0) {
          unit.currentHp = 0;
          unit.alive = false;
          deaths.push({ uid: unit.uid, tick });
          continue;
        }
      }

      // Stun: skip turn
      if (unit.stun > 0) {
        unit.stun--;
        continue;
      }

      const targets = unit.side === 'player'
        ? enemyTeam.filter(e => e.alive)
        : playerTeam.filter(e => e.alive);

      if (targets.length === 0) break;

      const target = pickTarget(unit, targets);
      if (!target) continue;

      // Calculate damage
      let dmg = Math.max(1, unit.atk - target.defStat);

      // Crit chance
      let isCrit = false;
      let critChance = unit.synergyBonuses.crit / 100;

      // Hakurou: 40% crit
      if (unit.def.id === 'hakurou') critChance += 0.4;

      // Shion: 20% double damage
      if (unit.def.id === 'shion' && Math.random() < 0.2) {
        dmg *= 2;
        isCrit = true;
      } else if (Math.random() < critChance) {
        dmg = Math.floor(dmg * 1.5);
        isCrit = true;
      }

      // Goblin damage reduction
      if (target.def.id === 'goblin') {
        dmg = Math.floor(dmg * 0.9);
      }

      // Back row damage reduction (gridY === 1 = back row, takes 20% less)
      if (target.gridY === 1) {
        dmg = Math.floor(dmg * 0.8);
      }

      // Diablo execute
      if (unit.def.id === 'diablo' && target.currentHp / target.maxHp < 0.25) {
        dmg = target.currentHp;
      }

      target.currentHp -= dmg;
      damages.push({ attackerUid: unit.uid, targetUid: target.uid, damage: dmg, isCrit, tick });

      if (target.currentHp <= 0) {
        target.currentHp = 0;
        target.alive = false;
        deaths.push({ uid: target.uid, tick });
      }

      // --- Geld stun mechanic: 15% chance to stun attacker when Geld is hit ---
      // (processed reactively on the target's side)
      if (target.def.id === 'geld' && target.alive && Math.random() < 0.15) {
        unit.stun = Math.max(unit.stun, 1);
      }

      // --- Souei poison: attacks apply 3 ticks of poison ---
      if (unit.def.id === 'souei' && target.alive) {
        target.poison = Math.max(target.poison, 3);
      }

      // Special abilities
      // Benimaru AoE + burn
      if (unit.def.id === 'benimaru') {
        const aoeTargets = unit.side === 'player'
          ? enemyTeam.filter(e => e.alive && e.uid !== target.uid)
          : playerTeam.filter(e => e.alive && e.uid !== target.uid);
        for (const t of aoeTargets) {
          let aoeDmg = 15;
          // Back row reduction on AoE too
          if (t.gridY === 1) {
            aoeDmg = Math.floor(aoeDmg * 0.8);
          }
          t.currentHp -= aoeDmg;
          damages.push({ attackerUid: unit.uid, targetUid: t.uid, damage: aoeDmg, isCrit: false, tick });
          // Apply burn to AoE targets
          t.burn = Math.max(t.burn, 2);
          if (t.currentHp <= 0) {
            t.currentHp = 0;
            t.alive = false;
            deaths.push({ uid: t.uid, tick });
          }
        }
        // Also apply burn to the primary target
        if (target.alive) {
          target.burn = Math.max(target.burn, 2);
        }
      }

      // Veldora AoE
      if (unit.def.id === 'veldora') {
        const aoeTargets = unit.side === 'player'
          ? enemyTeam.filter(e => e.alive && e.uid !== target.uid)
          : playerTeam.filter(e => e.alive && e.uid !== target.uid);
        for (const t of aoeTargets) {
          let aoeDmg = 30;
          if (t.gridY === 1) {
            aoeDmg = Math.floor(aoeDmg * 0.8);
          }
          t.currentHp -= aoeDmg;
          damages.push({ attackerUid: unit.uid, targetUid: t.uid, damage: aoeDmg, isCrit: false, tick });
          if (t.currentHp <= 0) {
            t.currentHp = 0;
            t.alive = false;
            deaths.push({ uid: t.uid, tick });
          }
        }
      }

      // Shuna heal
      if (unit.def.id === 'shuna') {
        const allies = (unit.side === 'player' ? playerTeam : enemyTeam).filter(a => a.alive && a.uid !== unit.uid);
        if (allies.length > 0) {
          const injured = allies.reduce((min, a) =>
            (a.currentHp / a.maxHp) < (min.currentHp / min.maxHp) ? a : min, allies[0]);
          const heal = Math.min(20, injured.maxHp - injured.currentHp);
          if (heal > 0) {
            injured.currentHp += heal;
            heals.push({ healerUid: unit.uid, targetUid: injured.uid, amount: heal, tick });
          }
        }
      }
    }

    tick++;
  }

  const survivingEnemies = enemyTeam.filter(u => u.alive).length;
  const winner = playerTeam.some(u => u.alive) ? 'player' as const : 'enemy' as const;

  return { damages, deaths, heals, winner, survivingEnemies };
}
