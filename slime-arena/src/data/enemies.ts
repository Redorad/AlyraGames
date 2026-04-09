import { EnemyRound } from '../types';

export const ENEMY_ROUNDS: EnemyRound[] = [
  {
    round: 1,
    name: 'Goblin Pack',
    units: [
      { id: 'goblin', gridX: 0, gridY: 0 },
      { id: 'goblin', gridX: 1, gridY: 0 },
    ],
  },
  {
    round: 2,
    name: 'Hungry Wolves',
    units: [
      { id: 'direwolf', gridX: 0, gridY: 0 },
      { id: 'direwolf', gridX: 1, gridY: 0 },
      { id: 'ranga', gridX: 2, gridY: 0 },
    ],
  },
  {
    round: 3,
    name: 'Ogre Patrol',
    units: [
      { id: 'goblin', gridX: 0, gridY: 0 },
      { id: 'shion', gridX: 1, gridY: 0 },
      { id: 'direwolf', gridX: 2, gridY: 1 },
    ],
  },
  {
    round: 4,
    name: 'Fire Squad',
    units: [
      { id: 'benimaru', gridX: 0, gridY: 0 },
      { id: 'shion', gridX: 1, gridY: 0 },
      { id: 'goblin', gridX: 2, gridY: 1 },
      { id: 'ranga', gridX: 3, gridY: 1 },
    ],
  },
  {
    round: 5,
    name: 'Shadow Assassins',
    units: [
      { id: 'souei', gridX: 0, gridY: 0 },
      { id: 'souei', gridX: 1, gridY: 0 },
      { id: 'geld', gridX: 2, gridY: 1 },
      { id: 'shuna', gridX: 3, gridY: 1 },
    ],
  },
  {
    round: 6,
    name: 'Heavy Defense',
    units: [
      { id: 'geld', gridX: 0, gridY: 0 },
      { id: 'geld', gridX: 1, gridY: 0 },
      { id: 'benimaru', gridX: 2, gridY: 1 },
      { id: 'shuna', gridX: 3, gridY: 1 },
      { id: 'ranga', gridX: 0, gridY: 1 },
    ],
  },
  {
    round: 7,
    name: 'Awakened Kijins',
    units: [
      { id: 'shion', gridX: 0, gridY: 0 },
      { id: 'benimaru', gridX: 1, gridY: 0 },
      { id: 'souei', gridX: 2, gridY: 0 },
      { id: 'hakurou', gridX: 3, gridY: 1 },
      { id: 'shuna', gridX: 0, gridY: 1 },
    ],
  },
  {
    round: 8,
    name: 'Dark Legion',
    units: [
      { id: 'diablo', gridX: 0, gridY: 0 },
      { id: 'hakurou', gridX: 1, gridY: 0 },
      { id: 'geld', gridX: 2, gridY: 1 },
      { id: 'benimaru', gridX: 3, gridY: 1 },
      { id: 'souei', gridX: 0, gridY: 1 },
      { id: 'shuna', gridX: 1, gridY: 1 },
    ],
  },
  {
    round: 9,
    name: 'Tempest Vanguard',
    units: [
      { id: 'diablo', gridX: 0, gridY: 0 },
      { id: 'hakurou', gridX: 1, gridY: 0 },
      { id: 'shion', gridX: 2, gridY: 0 },
      { id: 'benimaru', gridX: 3, gridY: 0 },
      { id: 'geld', gridX: 0, gridY: 1 },
      { id: 'shuna', gridX: 1, gridY: 1 },
    ],
  },
  {
    round: 10,
    name: 'Rimuru - The Demon Lord',
    units: [
      { id: 'rimuru', gridX: 1, gridY: 0 },
      { id: 'diablo', gridX: 0, gridY: 0 },
      { id: 'veldora', gridX: 2, gridY: 0 },
      { id: 'benimaru', gridX: 3, gridY: 0 },
      { id: 'hakurou', gridX: 0, gridY: 1 },
      { id: 'shion', gridX: 1, gridY: 1 },
      { id: 'shuna', gridX: 2, gridY: 1 },
    ],
  },
];
