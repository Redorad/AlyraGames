import { GameEvent, GameState } from '../types';

export const GAME_EVENTS: GameEvent[] = [
  {
    id: 'orc_raid',
    title: 'Raid Orc!',
    description: 'Des orcs attaquent Tempest!',
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
    title: 'Marchand itinerant',
    description: 'Un marchand offre des ressources!',
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
    title: 'Recolte abondante',
    description: 'Les champs donnent plus que prevu!',
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
    title: 'Vague de magie',
    description: 'Une vague de magicules traverse la region!',
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
    title: 'Commerce Gobelin',
    description: 'Les gobelins proposent du bois et de la pierre.',
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
    title: 'Tempete!',
    description: 'Une tempete endommage les reserves de bois.',
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
    title: 'Benediction de Rimuru',
    description: 'Rimuru partage son pouvoir avec la colonie!',
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
    title: 'Attaque de bandits',
    description: 'Des bandits volent de l\'or!',
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
