import { SynergyDef } from '../types';

export const SYNERGIES: SynergyDef[] = [
  {
    id: 'ogre',
    name: 'Ogre',
    emoji: '👹',
    threshold: 2,
    bonus: '2+ Ogres: +15 ATK',
    effect: { atk: 15 },
  },
  {
    id: 'kijin',
    name: 'Kijin',
    emoji: '⚡',
    threshold: 3,
    bonus: '3+ Kijins: +25% Crit',
    effect: { crit: 25 },
  },
  {
    id: 'monster',
    name: 'Monster',
    emoji: '🐾',
    threshold: 4,
    bonus: '4+ Monsters: +50 HP',
    effect: { hp: 50 },
  },
  {
    id: 'rapide',
    name: 'Swift',
    emoji: '⚡',
    threshold: 2,
    bonus: '2+ Swift: +3 Speed',
    effect: { speed: 3 },
  },
  {
    id: 'demon',
    name: 'Demon',
    emoji: '👿',
    threshold: 2,
    bonus: '2+ Demons: +20 ATK',
    effect: { atk: 20 },
  },
  {
    id: 'guerisseur',
    name: 'Healer',
    emoji: '💚',
    threshold: 2,
    bonus: '2+ Healers: +30 HP',
    effect: { hp: 30 },
  },
];
