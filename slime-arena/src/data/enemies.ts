import { EnemyRound } from '../types';

export const ENEMY_ROUNDS: EnemyRound[] = [
  {
    round: 1,
    name: 'Meute de Goblins',
    units: [
      { id: 'goblin', gridX: 0, gridY: 0 },
      { id: 'goblin', gridX: 1, gridY: 0 },
    ],
  },
  {
    round: 2,
    name: 'Loups Affamés',
    units: [
      { id: 'direwolf', gridX: 0, gridY: 0 },
      { id: 'direwolf', gridX: 1, gridY: 0 },
      { id: 'ranga', gridX: 2, gridY: 0 },
    ],
  },
  {
    round: 3,
    name: 'Patrouille Ogre',
    units: [
      { id: 'goblin', gridX: 0, gridY: 0 },
      { id: 'shion', gridX: 1, gridY: 0 },
      { id: 'direwolf', gridX: 2, gridY: 1 },
    ],
  },
  {
    round: 4,
    name: 'Escouade de Feu',
    units: [
      { id: 'benimaru', gridX: 0, gridY: 0 },
      { id: 'shion', gridX: 1, gridY: 0 },
      { id: 'goblin', gridX: 2, gridY: 1 },
      { id: 'ranga', gridX: 3, gridY: 1 },
    ],
  },
  {
    round: 5,
    name: 'Assassins de l\'Ombre',
    units: [
      { id: 'souei', gridX: 0, gridY: 0 },
      { id: 'souei', gridX: 1, gridY: 0 },
      { id: 'geld', gridX: 2, gridY: 1 },
      { id: 'shuna', gridX: 3, gridY: 1 },
    ],
  },
  {
    round: 6,
    name: 'Défense Lourde',
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
    name: 'Kijins Éveillés',
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
    name: 'Légion Sombre',
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
    name: 'Avant-Garde de Tempest',
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
    name: 'Rimuru - Le Seigneur Démon',
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
