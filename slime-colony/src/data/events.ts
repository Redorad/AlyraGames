import { GameEvent, GameState } from '../types';

export const GAME_EVENTS: GameEvent[] = [
  {
    id: 'orc_raid',
    title: 'Orc Raid!',
    description: 'Orcs are attacking Tempest!',
    emoji: '👹',
    effect: (state: GameState) => {
      const damage = Math.max(0, 15 - state.totalDefense - state.totalSoldiers * 2);
      if (damage > 0) {
        return {
          resources: {
            ...state.resources,
            food: Math.max(0, state.resources.food - damage),
            gold: Math.max(0, state.resources.gold - Math.floor(damage / 2)),
          },
        };
      }
      return {};
    },
  },
  {
    id: 'merchant_visit',
    title: 'Traveling Merchant',
    description: 'A merchant offers resources!',
    emoji: '🧳',
    effect: (state: GameState) => ({
      resources: {
        ...state.resources,
        gold: state.resources.gold + 15,
        food: state.resources.food + 10,
      },
    }),
  },
  {
    id: 'harvest_bonus',
    title: 'Bountiful Harvest',
    description: 'The fields yield more than expected!',
    emoji: '🌻',
    effect: (state: GameState) => ({
      resources: {
        ...state.resources,
        food: state.resources.food + 25,
      },
    }),
  },
  {
    id: 'magic_surge',
    title: 'Magic Surge',
    description: 'A wave of magicules sweeps through the region!',
    emoji: '💫',
    effect: (state: GameState) => ({
      resources: {
        ...state.resources,
        magicules: state.resources.magicules + 15,
      },
    }),
  },
  {
    id: 'goblin_trade',
    title: 'Goblin Trade',
    description: 'The goblins offer wood and stone.',
    emoji: '👺',
    effect: (state: GameState) => ({
      resources: {
        ...state.resources,
        wood: state.resources.wood + 20,
        stone: state.resources.stone + 20,
      },
    }),
  },
  {
    id: 'storm',
    title: 'Storm!',
    description: 'A storm damages the wood reserves.',
    emoji: '🌩️',
    effect: (state: GameState) => ({
      resources: {
        ...state.resources,
        wood: Math.max(0, state.resources.wood - 15),
      },
    }),
  },
  {
    id: 'rimuru_blessing',
    title: 'Rimuru\'s Blessing',
    description: 'Rimuru shares his power with the colony!',
    emoji: '🔵',
    effect: (state: GameState) => ({
      resources: {
        ...state.resources,
        magicules: state.resources.magicules + 25,
        gold: state.resources.gold + 10,
      },
    }),
  },
  {
    id: 'bandit_attack',
    title: 'Bandit Attack',
    description: 'Bandits steal gold!',
    emoji: '🗡️',
    effect: (state: GameState) => {
      const loss = Math.max(0, 10 - state.totalDefense);
      return {
        resources: {
          ...state.resources,
          gold: Math.max(0, state.resources.gold - loss),
        },
      };
    },
  },
];

export function getRandomEvent(): GameEvent {
  return GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
}
