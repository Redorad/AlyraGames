import { ShopItemDef } from "./skills";

export const BUILDINGS: ShopItemDef[] = [
  { id: "goblin_hut", name: "Goblin Hut", emoji: "🛖", description: "+4/s — Basic shelter", baseCost: 120, passivePower: 4 },
  { id: "forge", name: "Kurobee's Forge", emoji: "⚒️", description: "+15/s — Legendary smithy", baseCost: 600, passivePower: 15 },
  { id: "trading_post", name: "Trading Post", emoji: "🏪", description: "+40/s — Commerce hub", baseCost: 3_000, passivePower: 40 },
  { id: "research_lab", name: "Research Lab", emoji: "🔬", description: "+100/s — Magical research", baseCost: 10_000, passivePower: 100 },
  { id: "colosseum", name: "Colosseum", emoji: "🏟️", description: "+280/s — Grand arena", baseCost: 40_000, passivePower: 280 },
  { id: "castle", name: "Rimuru's Castle", emoji: "🏰", description: "+800/s — Seat of power", baseCost: 200_000, passivePower: 800 },
  { id: "holy_barrier", name: "Holy Barrier", emoji: "🛡️", description: "+2.5K/s — Divine protection", baseCost: 1_000_000, passivePower: 2_500 },
  // Late-game buildings
  { id: "labyrinth", name: "Ramiris's Labyrinth", emoji: "🏗️", description: "+10K/s — Infinite dungeon", baseCost: 5_000_000, passivePower: 10_000 },
  { id: "world_gate", name: "World Gate", emoji: "🌀", description: "+35K/s — Portal nexus", baseCost: 30_000_000, passivePower: 35_000 },
  { id: "cardinal_tower", name: "Cardinal Tower", emoji: "🗼", description: "+120K/s — Intelligence network", baseCost: 150_000_000, passivePower: 120_000 },
  { id: "tempest_capital", name: "Tempest Capital", emoji: "🌆", description: "+500K/s — Mega-city", baseCost: 1_000_000_000, passivePower: 500_000 },
  { id: "celestial_palace", name: "Celestial Palace", emoji: "🏛️", description: "+2M/s — Seat of gods", baseCost: 10_000_000_000, passivePower: 2_000_000 },
];
