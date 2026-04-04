export interface ShopItemDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  baseCost: number;
  clickPower?: number;
  passivePower?: number;
}

export const SKILLS: ShopItemDef[] = [
  { id: "predator", name: "Predator", emoji: "👄", description: "+5/click — Devour and analyze", baseCost: 50, clickPower: 5 },
  { id: "great_sage", name: "Great Sage: Analyze", emoji: "🧠", description: "+1/s — Wisdom of the sage", baseCost: 75, passivePower: 1 },
  { id: "absorb_dissolve", name: "Absorb & Dissolve", emoji: "🫠", description: "+15/click — Break down matter", baseCost: 300, clickPower: 15 },
  { id: "ultraspeed_regen", name: "Ultraspeed Regen", emoji: "💚", description: "+5/s — Rapid recovery", baseCost: 500, passivePower: 5 },
  { id: "replication", name: "Replication", emoji: "🔄", description: "+50/click — Copy any form", baseCost: 2_000, clickPower: 50 },
  { id: "black_lightning", name: "Black Lightning", emoji: "⚡", description: "+25/s — Destructive energy", baseCost: 5_000, passivePower: 25 },
  { id: "void_god", name: "Void God Azathoth", emoji: "🌑", description: "+200/click — Consume reality", baseCost: 50_000, clickPower: 200 },
  { id: "soul_harvest", name: "Soul Harvest", emoji: "👻", description: "+120/s — Gather soul energy", baseCost: 100_000, passivePower: 120 },
  { id: "turn_null", name: "Turn Null", emoji: "✨", description: "+500/s — Nothingness energy", baseCost: 500_000, passivePower: 500 },
  // Late-game skills
  { id: "imaginary_space", name: "Imaginary Space", emoji: "🌀", description: "+1.5K/click — Dimensional rip", baseCost: 2_000_000, clickPower: 1_500 },
  { id: "nihility_collapse", name: "Nihility Collapse", emoji: "🕳️", description: "+2K/s — Erase existence", baseCost: 5_000_000, passivePower: 2_000 },
  { id: "multidim_barrier", name: "Multidimensional Barrier", emoji: "🛡️", description: "+5K/s — Infinite defense layers", baseCost: 20_000_000, passivePower: 5_000 },
  { id: "existence_erasure", name: "Existence Erasure", emoji: "💀", description: "+8K/click — Delete from reality", baseCost: 50_000_000, clickPower: 8_000 },
  { id: "time_stop", name: "Time Stop", emoji: "⏱️", description: "+15K/s — Freeze time itself", baseCost: 200_000_000, passivePower: 15_000 },
  { id: "origin_magic", name: "Origin Magic", emoji: "🔮", description: "+50K/s — Primordial sorcery", baseCost: 1_000_000_000, passivePower: 50_000 },
  { id: "end_of_world", name: "End of the World", emoji: "🌍", description: "+200K/click — Apocalyptic power", baseCost: 10_000_000_000, clickPower: 200_000 },
];
