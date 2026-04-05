export interface Evolution {
  name: string;
  emoji: string;
  multiplier: number;
  threshold: number;
}

export const EVOLUTIONS: Evolution[] = [
  // Early game (0–6)
  { name: "Small Slime", emoji: "💧", multiplier: 1, threshold: 0 },
  { name: "Slime", emoji: "🫧", multiplier: 2, threshold: 100 },
  { name: 'Named Slime "Rimuru"', emoji: "🔵", multiplier: 5, threshold: 1_000 },
  { name: "Dire Slime", emoji: "🌀", multiplier: 10, threshold: 10_000 },
  { name: "Tempest Slime", emoji: "⚡", multiplier: 25, threshold: 100_000 },
  { name: "Demon Slime", emoji: "😈", multiplier: 60, threshold: 1_000_000 },
  { name: "True Demon Lord", emoji: "👑", multiplier: 150, threshold: 25_000_000 },
  // Mid game (7–11) — prestige territory
  { name: "Ultimate Slime", emoji: "⭐", multiplier: 500, threshold: 500_000_000 },
  { name: "Chaos Creator", emoji: "🌌", multiplier: 2_000, threshold: 25_000_000_000 },
  { name: "Void God", emoji: "🌑", multiplier: 8_000, threshold: 500_000_000_000 },
  { name: "Transcendent Being", emoji: "🔮", multiplier: 50_000, threshold: 50_000_000_000_000 },
  { name: "Origin of All", emoji: "♾️", multiplier: 500_000, threshold: 1e16 },
  // Late game (12–15) — ascension territory
  { name: "Primordial Deity", emoji: "🔱", multiplier: 5_000_000, threshold: 1e19 },
  { name: "Cosmic Architect", emoji: "🪐", multiplier: 100_000_000, threshold: 1e22 },
  { name: "Dimensional Sovereign", emoji: "👁️", multiplier: 5_000_000_000, threshold: 1e26 },
  { name: "Eternal One", emoji: "🌠", multiplier: 500_000_000_000, threshold: 1e30 },
  // Endgame (16–19) — deep ascension
  { name: "Infinite Being", emoji: "✴️", multiplier: 1e14, threshold: 1e35 },
  { name: "Reality Weaver", emoji: "🕸️", multiplier: 1e17, threshold: 1e40 },
  { name: "The Absolute", emoji: "💠", multiplier: 1e21, threshold: 1e46 },
  { name: "Beyond All", emoji: "☀️", multiplier: 1e26, threshold: 1e53 },
];
