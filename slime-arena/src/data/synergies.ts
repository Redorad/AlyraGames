import { SynergyDef } from '../types';

export const SYNERGIES: SynergyDef[] = [
  {
    id: 'ogre',
    name: 'Ogre',
    emoji: '👹',
    threshold: 2,
    bonus: '2+ Ogres : +15 ATK',
    effect: { atk: 15 },
  },
  {
    id: 'kijin',
    name: 'Kijin',
    emoji: '⚡',
    threshold: 3,
    bonus: '3+ Kijins : +25% Critique',
    effect: { crit: 25 },
  },
  {
    id: 'monster',
    name: 'Monstre',
    emoji: '🐾',
    threshold: 4,
    bonus: '4+ Monstres : +50 PV',
    effect: { hp: 50 },
  },
];
