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
  {
    id: 'rapide',
    name: 'Rapide',
    emoji: '⚡',
    threshold: 2,
    bonus: '2+ Rapides : +3 Vitesse',
    effect: { speed: 3 },
  },
  {
    id: 'demon',
    name: 'Démon',
    emoji: '👿',
    threshold: 2,
    bonus: '2+ Démons : +20 ATK',
    effect: { atk: 20 },
  },
  {
    id: 'guerisseur',
    name: 'Guérisseur',
    emoji: '💚',
    threshold: 2,
    bonus: '2+ Guérisseurs : +30 PV',
    effect: { hp: 30 },
  },
];
