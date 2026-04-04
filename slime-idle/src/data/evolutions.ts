export interface Evolution {
  name: string;
  emoji: string;
  multiplier: number;
  threshold: number;
}

export const EVOLUTIONS: Evolution[] = [
  { name: "Small Slime", emoji: "💧", multiplier: 1, threshold: 0 },
  { name: "Slime", emoji: "🫧", multiplier: 2, threshold: 100 },
  { name: 'Named Slime "Rimuru"', emoji: "🔵", multiplier: 5, threshold: 1_000 },
  { name: "Dire Slime", emoji: "🌀", multiplier: 12, threshold: 10_000 },
  { name: "Tempest Slime", emoji: "⚡", multiplier: 30, threshold: 100_000 },
  { name: "Demon Slime", emoji: "😈", multiplier: 80, threshold: 1_000_000 },
  { name: "True Demon Lord", emoji: "👑", multiplier: 250, threshold: 50_000_000 },
  { name: "Ultimate Slime", emoji: "⭐", multiplier: 1000, threshold: 1_000_000_000 },
];
