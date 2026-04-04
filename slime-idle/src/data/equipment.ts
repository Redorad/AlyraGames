export type EquipSlot = "weapon" | "armor" | "accessory" | "rune";

export interface EquipItem {
  id: string;
  name: string;
  emoji: string;
  slot: EquipSlot;
  rarity: "common" | "rare" | "epic" | "legendary";
  effect: { type: "click_mult" | "passive_mult" | "all_mult" | "crit_chance" | "crit_mult" | "cost_reduction"; value: number };
  source: string; // how to obtain
}

export const EQUIPMENT: EquipItem[] = [
  // Weapons
  { id: "eq_wooden_sword", name: "Wooden Sword", emoji: "🗡️", slot: "weapon", rarity: "common", effect: { type: "click_mult", value: 0.15 }, source: "Boss: Ifrit" },
  { id: "eq_magic_blade", name: "Magic Blade", emoji: "⚔️", slot: "weapon", rarity: "rare", effect: { type: "click_mult", value: 0.4 }, source: "Boss: Orc Disaster" },
  { id: "eq_storm_fang", name: "Storm Fang", emoji: "🌩️", slot: "weapon", rarity: "epic", effect: { type: "click_mult", value: 0.8 }, source: "Boss Rush wave 10" },
  { id: "eq_void_blade", name: "Void God Blade", emoji: "🌑", slot: "weapon", rarity: "legendary", effect: { type: "click_mult", value: 1.5 }, source: "Boss Rush wave 25" },

  // Armor
  { id: "eq_slime_coat", name: "Slime Coat", emoji: "🧥", slot: "armor", rarity: "common", effect: { type: "passive_mult", value: 0.15 }, source: "Dungeon: Sealed Cave" },
  { id: "eq_scale_mail", name: "Dragon Scale Mail", emoji: "🛡️", slot: "armor", rarity: "rare", effect: { type: "passive_mult", value: 0.4 }, source: "Boss: Charybdis" },
  { id: "eq_demon_armor", name: "Demon Lord Armor", emoji: "🦾", slot: "armor", rarity: "epic", effect: { type: "passive_mult", value: 0.8 }, source: "Boss: Hinata" },
  { id: "eq_origin_robe", name: "Robe of Origin", emoji: "👘", slot: "armor", rarity: "legendary", effect: { type: "all_mult", value: 1.0 }, source: "Boss Rush wave 30" },

  // Accessories
  { id: "eq_lucky_charm", name: "Lucky Charm", emoji: "🍀", slot: "accessory", rarity: "common", effect: { type: "crit_chance", value: 0.05 }, source: "Dungeon: Jura Depths" },
  { id: "eq_sage_monocle", name: "Sage's Monocle", emoji: "🧐", slot: "accessory", rarity: "rare", effect: { type: "cost_reduction", value: 0.1 }, source: "Boss: Clayman" },
  { id: "eq_time_ring", name: "Ring of Time", emoji: "💍", slot: "accessory", rarity: "epic", effect: { type: "crit_mult", value: 0.6 }, source: "Boss: Milim" },
  { id: "eq_creation_jewel", name: "Jewel of Creation", emoji: "💎", slot: "accessory", rarity: "legendary", effect: { type: "all_mult", value: 0.8 }, source: "Boss Rush wave 20" },

  // Runes
  { id: "eq_fire_rune", name: "Fire Rune", emoji: "🔴", slot: "rune", rarity: "common", effect: { type: "click_mult", value: 0.1 }, source: "Army: Dwargon" },
  { id: "eq_ice_rune", name: "Ice Rune", emoji: "🔵", slot: "rune", rarity: "rare", effect: { type: "passive_mult", value: 0.3 }, source: "Army: Eurazania" },
  { id: "eq_void_rune", name: "Void Rune", emoji: "🟣", slot: "rune", rarity: "epic", effect: { type: "all_mult", value: 0.5 }, source: "Army: Walpurgis Hall" },
  { id: "eq_origin_rune", name: "Origin Rune", emoji: "⚪", slot: "rune", rarity: "legendary", effect: { type: "all_mult", value: 1.2 }, source: "Artifact Fusion" },
];

export const EQUIP_SLOTS: { slot: EquipSlot; label: string; emoji: string }[] = [
  { slot: "weapon", label: "Weapon", emoji: "⚔️" },
  { slot: "armor", label: "Armor", emoji: "🛡️" },
  { slot: "accessory", label: "Accessory", emoji: "💍" },
  { slot: "rune", label: "Rune", emoji: "🔮" },
];

export const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-300",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};

export const RARITY_BORDERS: Record<string, string> = {
  common: "border-gray-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-yellow-500/30",
};
