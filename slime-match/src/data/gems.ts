import { GemDef, GemType } from '../types';

export const GEM_DEFS: Record<GemType, GemDef> = {
  water:     { type: 'water',     emoji: '🔵', color: '#3b82f6', label: 'Water Slime' },
  fire:      { type: 'fire',      emoji: '🔴', color: '#ef4444', label: 'Fire Slime' },
  nature:    { type: 'nature',    emoji: '🟢', color: '#22c55e', label: 'Nature Slime' },
  lightning: { type: 'lightning', emoji: '🟡', color: '#eab308', label: 'Lightning Slime' },
  dark:      { type: 'dark',      emoji: '🟣', color: '#a855f7', label: 'Dark Slime' },
  holy:      { type: 'holy',      emoji: '⚪', color: '#e5e7eb', label: 'Holy Slime' },
};

export const GEM_TYPES: GemType[] = ['water', 'fire', 'nature', 'lightning', 'dark', 'holy'];

export function getGemEmoji(type: GemType): string {
  return GEM_DEFS[type].emoji;
}

export function getGemColor(type: GemType): string {
  return GEM_DEFS[type].color;
}
