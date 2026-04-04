import { ShopItemDef } from "./skills";

export const BUILDINGS: ShopItemDef[] = [
  { id: "goblin_hut", name: "Goblin Hut", emoji: "🛖", description: "+4/s — Basic shelter", baseCost: 120, passivePower: 4 },
  { id: "forge", name: "Kurobee's Forge", emoji: "⚒️", description: "+15/s — Legendary smithy", baseCost: 600, passivePower: 15 },
  { id: "trading_post", name: "Trading Post", emoji: "🏪", description: "+40/s — Commerce hub", baseCost: 3_000, passivePower: 40 },
  { id: "research_lab", name: "Research Lab", emoji: "🔬", description: "+100/s — Magical research", baseCost: 10_000, passivePower: 100 },
  { id: "colosseum", name: "Colosseum", emoji: "🏟️", description: "+280/s — Grand arena", baseCost: 40_000, passivePower: 280 },
  { id: "castle", name: "Rimuru's Castle", emoji: "🏰", description: "+800/s — Seat of power", baseCost: 200_000, passivePower: 800 },
  { id: "holy_barrier", name: "Holy Barrier", emoji: "🛡️", description: "+2500/s — Divine protection", baseCost: 1_000_000, passivePower: 2500 },
];
