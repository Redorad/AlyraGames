import { create } from "zustand";
import type { GameScreen, MapNode, PlayerState, EnemyInstance, CardInstance, CombatReward } from "../types";
import { CARDS, createStarterDeck, getRandomCards } from "../data/cards";
import { spawnCombatEnemies, spawnEliteEnemies, spawnBoss, rollIntent, ENEMY_DEFS } from "../data/enemies";
import { generateMap } from "../data/map";
import * as sfx from "../utils/sounds";

interface GameStore {
  /* ── navigation ──────────── */
  screen: GameScreen;

  /* ── run state ───────────── */
  act: number;
  floor: number;
  player: PlayerState;
  deck: CardInstance[];
  map: MapNode[][];
  currentNodeId: number | null;
  availableNodeIds: number[];

  /* ── combat ──────────────── */
  enemies: EnemyInstance[];
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  turn: number;
  combatReward: CombatReward | null;
  animatingCard: number | null; // uid of card being played

  /* ── meta ─────────────────── */
  bestFloor: number;
  nextUid: number;

  /* ── actions ─────────────── */
  startRun: () => void;
  selectNode: (nodeId: number) => void;
  enterCombat: (enemies: EnemyInstance[]) => void;
  playCard: (cardUid: number, targetIdx?: number) => void;
  endTurn: () => void;
  pickRewardCard: (cardId: string) => void;
  skipReward: () => void;
  rest: () => void;
  goToMap: () => void;
  advanceAct: () => void;
}

let _nextUid = 1;
function uid() { return _nextUid++; }

function makeDeck(cardIds: string[]): CardInstance[] {
  return cardIds.map((defId) => ({ uid: uid(), defId, upgraded: false }));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCards(state: { drawPile: CardInstance[]; discardPile: CardInstance[]; hand: CardInstance[] }, count: number) {
  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) break;
      state.drawPile = shuffle(state.discardPile);
      state.discardPile = [];
    }
    state.hand.push(state.drawPile.shift()!);
  }
}

function calcDamage(base: number, strength: number, weak: boolean): number {
  let dmg = base + strength;
  if (weak) dmg = Math.floor(dmg * 0.75);
  return Math.max(0, dmg);
}

function calcBlock(base: number, dexterity: number): number {
  return Math.max(0, base + dexterity);
}

function applyDamageToTarget(target: { hp: number; block: number; vulnerable: number }, damage: number): number {
  let dmg = damage;
  if (target.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
  const blocked = Math.min(target.block, dmg);
  target.block -= blocked;
  const hpDmg = dmg - blocked;
  target.hp = Math.max(0, target.hp - hpDmg);
  return hpDmg;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: "title",
  act: 1,
  floor: 0,
  player: { hp: 80, maxHp: 80, block: 0, energy: 3, maxEnergy: 3, strength: 0, dexterity: 0, weak: 0, vulnerable: 0, gold: 100 },
  deck: [],
  map: [],
  currentNodeId: null,
  availableNodeIds: [],
  enemies: [],
  hand: [],
  drawPile: [],
  discardPile: [],
  exhaustPile: [],
  turn: 0,
  combatReward: null,
  animatingCard: null,
  bestFloor: 0,
  nextUid: 1,

  startRun: () => {
    _nextUid = 1;
    const deck = makeDeck(createStarterDeck());
    const map = generateMap(1);
    set({
      screen: "map",
      act: 1,
      floor: 0,
      player: { hp: 80, maxHp: 80, block: 0, energy: 3, maxEnergy: 3, strength: 0, dexterity: 0, weak: 0, vulnerable: 0, gold: 100 },
      deck,
      map,
      currentNodeId: null,
      availableNodeIds: map[0].map((n) => n.id),
      enemies: [],
      hand: [],
      drawPile: [],
      discardPile: [],
      exhaustPile: [],
      turn: 0,
      combatReward: null,
      animatingCard: null,
    });
  },

  selectNode: (nodeId) => {
    const s = get();
    const allNodes = s.map.flat();
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node || !s.availableNodeIds.includes(nodeId)) return;

    sfx.playClick();
    node.cleared = true;
    const newFloor = s.floor + 1;

    // Set available nodes to connections of this node
    const nextAvailable = node.connections;

    set({ currentNodeId: nodeId, availableNodeIds: nextAvailable, floor: newFloor });

    switch (node.type) {
      case "combat":
        get().enterCombat(spawnCombatEnemies(s.act));
        break;
      case "elite":
        get().enterCombat(spawnEliteEnemies(s.act));
        break;
      case "boss":
        get().enterCombat(spawnBoss(s.act));
        break;
      case "rest":
        set({ screen: "rest" });
        break;
      case "shop":
        // Simple: show 3 cards to buy
        set({ screen: "shop", combatReward: { gold: 0, cardChoices: getRandomCards(3) } });
        break;
      case "event":
        set({ screen: "event" });
        break;
    }
  },

  enterCombat: (enemies) => {
    const s = get();
    // Roll initial intents
    for (const e of enemies) {
      e.intent = rollIntent(e, 0);
    }
    const drawPile = shuffle([...s.deck]);
    const hand: CardInstance[] = [];
    const discardPile: CardInstance[] = [];
    const piles = { drawPile, discardPile, hand };
    drawCards(piles, 5);

    set({
      screen: "combat",
      enemies,
      hand: piles.hand,
      drawPile: piles.drawPile,
      discardPile: piles.discardPile,
      exhaustPile: [],
      turn: 1,
      player: { ...s.player, block: 0, energy: s.player.maxEnergy },
      combatReward: null,
    });
  },

  playCard: (cardUid, targetIdx = 0) => {
    const s = get();
    if (s.screen !== "combat") return;

    const cardIdx = s.hand.findIndex((c) => c.uid === cardUid);
    if (cardIdx === -1) return;

    const card = s.hand[cardIdx];
    const def = CARDS[card.defId];
    if (!def) return;

    const player = { ...s.player };
    if (player.energy < def.cost) return;

    player.energy -= def.cost;
    sfx.playCardPlay();

    const enemies = s.enemies.map((e) => ({ ...e }));
    const newHand = [...s.hand];
    newHand.splice(cardIdx, 1);

    // Apply card effects
    const targets = def.target === "all_enemies" ? enemies : def.target === "enemy" ? [enemies[targetIdx]] : [];
    const selfTarget = def.target === "self" || def.heal || def.block || def.applyStrength || def.applyDexterity;

    // Damage
    if (def.damage) {
      const hits = def.hits ?? 1;
      for (let h = 0; h < hits; h++) {
        for (const t of targets) {
          if (t.hp <= 0) continue;
          let dmg = calcDamage(def.damage, player.strength, player.weak > 0);
          // CriticalCut bonus
          if (def.id === "criticalCut" && t.vulnerable > 0) {
            dmg += 10;
          }
          applyDamageToTarget(t, dmg);
          sfx.playAttack();
        }
      }
    }

    // Block
    if (def.block) {
      const bl = calcBlock(def.block, player.dexterity);
      player.block += bl;
      sfx.playBlock();
    }

    // Heal
    if (def.heal) {
      player.hp = Math.min(player.maxHp, player.hp + def.heal);
      sfx.playHeal();
    }

    // Draw
    const newDraw = [...s.drawPile];
    const newDiscard = [...s.discardPile];
    if (def.draw) {
      const piles = { drawPile: newDraw, discardPile: newDiscard, hand: newHand };
      drawCards(piles, def.draw);
      sfx.playDraw();
    }

    // Status effects on enemies
    if (def.applyWeak) {
      for (const t of targets) t.weak += def.applyWeak;
      sfx.playDebuff();
    }
    if (def.applyVulnerable) {
      for (const t of targets) t.vulnerable += def.applyVulnerable;
      sfx.playDebuff();
    }

    // Self buffs
    if (def.applyStrength) { player.strength += def.applyStrength; sfx.playBuff(); }
    if (def.applyDexterity) { player.dexterity += def.applyDexterity; sfx.playBuff(); }

    // Handle exhausted / discard
    if (def.exhaust) {
      set((prev) => ({ exhaustPile: [...prev.exhaustPile, card] }));
    } else {
      newDiscard.push(card);
    }

    // Check dead enemies
    const aliveEnemies = enemies.filter((e) => e.hp > 0);
    const deadCount = enemies.length - aliveEnemies.length;
    if (deadCount > 0) sfx.playEnemyDie();

    // Gold from kills
    let goldGain = 0;
    for (const e of enemies) {
      if (e.hp <= 0) {
        const eDef = ENEMY_DEFS[e.defId];
        goldGain += eDef.maxHp >= 60 ? 25 : eDef.maxHp >= 40 ? 15 : 10;
      }
    }

    const newPlayer = { ...player, gold: player.gold + goldGain };

    // Victory check
    if (aliveEnemies.length === 0) {
      sfx.playVictory();
      const reward: CombatReward = {
        gold: 15 + Math.floor(Math.random() * 15),
        cardChoices: getRandomCards(3),
      };
      set({
        enemies: aliveEnemies,
        hand: newHand,
        drawPile: newDraw,
        discardPile: newDiscard,
        player: { ...newPlayer, gold: newPlayer.gold + reward.gold },
        combatReward: reward,
        screen: "reward",
      });
      return;
    }

    set({
      enemies: aliveEnemies,
      hand: newHand,
      drawPile: newDraw,
      discardPile: newDiscard,
      player: newPlayer,
    });
  },

  endTurn: () => {
    const s = get();
    if (s.screen !== "combat") return;

    // Discard hand
    const newDiscard = [...s.discardPile, ...s.hand];
    const newDraw = [...s.drawPile];

    // Enemy turn
    const player = { ...s.player, block: 0 };
    const enemies = s.enemies.map((e) => ({ ...e, block: 0 }));

    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      const intent = enemy.intent;

      switch (intent.type) {
        case "attack": {
          let dmg = intent.value;
          if (enemy.weak > 0) dmg = Math.floor(dmg * 0.75);
          applyDamageToTarget(player, dmg);
          sfx.playHit();
          break;
        }
        case "defend":
          enemy.block += intent.value;
          break;
        case "attack_defend": {
          let dmg = intent.value;
          if (enemy.weak > 0) dmg = Math.floor(dmg * 0.75);
          applyDamageToTarget(player, dmg);
          enemy.block += intent.value2 ?? 0;
          sfx.playHit();
          break;
        }
        case "buff":
          enemy.strength += intent.value;
          sfx.playBuff();
          break;
        case "debuff":
          player.weak += intent.value;
          player.vulnerable += intent.value;
          sfx.playDebuff();
          break;
      }

      // Tick status durations
      if (enemy.weak > 0) enemy.weak--;
      if (enemy.vulnerable > 0) enemy.vulnerable--;
    }

    // Tick player status
    if (player.weak > 0) player.weak--;
    if (player.vulnerable > 0) player.vulnerable--;

    // Check player death
    if (player.hp <= 0) {
      sfx.playDefeat();
      set({
        player,
        enemies,
        hand: [],
        drawPile: newDraw,
        discardPile: newDiscard,
        screen: "game_over",
        bestFloor: Math.max(get().bestFloor, get().floor),
      });
      return;
    }

    // Roll new intents
    const nextTurn = s.turn + 1;
    for (const e of enemies) {
      e.intent = rollIntent(e, nextTurn);
    }

    // Draw new hand
    player.energy = player.maxEnergy;
    const piles = { drawPile: newDraw, discardPile: newDiscard, hand: [] as CardInstance[] };
    drawCards(piles, 5);

    set({
      player,
      enemies,
      hand: piles.hand,
      drawPile: piles.drawPile,
      discardPile: piles.discardPile,
      turn: nextTurn,
    });
  },

  pickRewardCard: (cardId) => {
    const s = get();
    const def = CARDS[cardId];
    if (!def) return;
    sfx.playGold();
    const newCard: CardInstance = { uid: uid(), defId: cardId, upgraded: false };
    set({
      deck: [...s.deck, newCard],
    });
    get().goToMap();
  },

  skipReward: () => {
    get().goToMap();
  },

  rest: () => {
    const s = get();
    const heal = Math.round(s.player.maxHp * 0.3);
    sfx.playHeal();
    set({
      player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + heal) },
    });
    get().goToMap();
  },

  goToMap: () => {
    const s = get();
    // Check if we've cleared the boss (last row)
    const lastRow = s.map[s.map.length - 1];
    const bossCleared = lastRow.some((n) => n.cleared);

    if (bossCleared) {
      if (s.act >= 3) {
        // Game won!
        set({ screen: "victory", bestFloor: Math.max(s.bestFloor, s.floor) });
      } else {
        // Advance to next act
        get().advanceAct();
      }
    } else {
      set({ screen: "map" });
    }
  },

  advanceAct: () => {
    const s = get();
    const nextAct = s.act + 1;
    const newMap = generateMap(nextAct);
    set({
      act: nextAct,
      map: newMap,
      currentNodeId: null,
      availableNodeIds: newMap[0].map((n) => n.id),
      screen: "map",
    });
  },
}));
