export interface Artifact {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  effect: { type: "click_mult" | "passive_mult" | "all_mult" | "crit_chance" | "crit_mult" | "cost_reduction"; value: number };
}

export const ARTIFACTS: Artifact[] = [
  // Common
  { id: "art_slime_core", name: "Slime Core", emoji: "💧", description: "×1.05 all income", rarity: "common", effect: { type: "all_mult", value: 1.05 } },
  { id: "art_magic_ore", name: "Magic Ore", emoji: "💎", description: "×1.1 passive income", rarity: "common", effect: { type: "passive_mult", value: 1.1 } },
  { id: "art_sharp_fang", name: "Sharp Fang", emoji: "🦷", description: "×1.1 click power", rarity: "common", effect: { type: "click_mult", value: 1.1 } },
  { id: "art_herb", name: "Hipokute Herb", emoji: "🌿", description: "×1.08 all income", rarity: "common", effect: { type: "all_mult", value: 1.08 } },

  // Rare
  { id: "art_magisteel", name: "Magisteel Ingot", emoji: "🔩", description: "×1.15 passive income", rarity: "rare", effect: { type: "passive_mult", value: 1.15 } },
  { id: "art_dragon_scale", name: "Dragon Scale", emoji: "🐉", description: "×1.2 click power", rarity: "rare", effect: { type: "click_mult", value: 1.2 } },
  { id: "art_spirit_stone", name: "Spirit Stone", emoji: "🔮", description: "+5% crit chance", rarity: "rare", effect: { type: "crit_chance", value: 0.05 } },
  { id: "art_merchants_ring", name: "Merchant's Ring", emoji: "💍", description: "-5% shop costs", rarity: "rare", effect: { type: "cost_reduction", value: 0.05 } },

  // Epic
  { id: "art_demon_horn", name: "Demon Lord's Horn", emoji: "😈", description: "×1.25 all income", rarity: "epic", effect: { type: "all_mult", value: 1.25 } },
  { id: "art_soul_gem", name: "Soul Gem", emoji: "💜", description: "×1.5 crit multiplier", rarity: "epic", effect: { type: "crit_mult", value: 1.5 } },
  { id: "art_void_shard", name: "Void Shard", emoji: "🌑", description: "×1.3 click power", rarity: "epic", effect: { type: "click_mult", value: 1.3 } },
  { id: "art_tempest_banner", name: "Tempest Banner", emoji: "🏴", description: "×1.3 passive income", rarity: "epic", effect: { type: "passive_mult", value: 1.3 } },

  // Legendary
  { id: "art_meggido", name: "Meggido", emoji: "⚡", description: "×1.5 all income", rarity: "legendary", effect: { type: "all_mult", value: 1.5 } },
  { id: "art_mask_rimuru", name: "Rimuru's Mask", emoji: "🎭", description: "-15% shop costs", rarity: "legendary", effect: { type: "cost_reduction", value: 0.15 } },
  { id: "art_veldora_journal", name: "Veldora's Journal", emoji: "📖", description: "×2 passive income", rarity: "legendary", effect: { type: "passive_mult", value: 2.0 } },
  { id: "art_angelic_skill", name: "Angelic Skill Core", emoji: "👼", description: "+15% crit chance", rarity: "legendary", effect: { type: "crit_chance", value: 0.15 } },
];

const RARITY_WEIGHTS = { common: 50, rare: 30, epic: 15, legendary: 5 };

export function rollArtifact(ownedArtifacts: string[]): Artifact | null {
  const available = ARTIFACTS.filter((a) => !ownedArtifacts.includes(a.id));
  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, a) => sum + RARITY_WEIGHTS[a.rarity], 0);
  let roll = Math.random() * totalWeight;
  for (const a of available) {
    roll -= RARITY_WEIGHTS[a.rarity];
    if (roll <= 0) return a;
  }
  return available[available.length - 1];
}
