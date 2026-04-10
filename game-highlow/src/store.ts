import { create } from "zustand";

export type Suit = "♠" | "♥" | "♦" | "♣";
export interface Card {
  rank: number; // 1..13
  suit: Suit;
}

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];

function randomCard(): Card {
  return {
    rank: Math.floor(Math.random() * 13) + 1,
    suit: SUITS[Math.floor(Math.random() * 4)],
  };
}

export const rankLabel = (r: number) => {
  if (r === 1) return "A";
  if (r === 11) return "J";
  if (r === 12) return "Q";
  if (r === 13) return "K";
  return String(r);
};

interface State {
  current: Card;
  next: Card | null;
  streak: number;
  best: number;
  score: number;
  message: string;
  status: "playing" | "lost";
  flipping: boolean;
  guess: (dir: "high" | "low" | "same") => void;
  reset: () => void;
}

const loadBest = () => {
  try {
    return parseInt(localStorage.getItem("hl_best") || "0", 10);
  } catch {
    return 0;
  }
};

const saveBest = (n: number) => {
  try {
    localStorage.setItem("hl_best", String(n));
  } catch {}
};

export const useGame = create<State>((set, get) => ({
  current: randomCard(),
  next: null,
  streak: 0,
  best: loadBest(),
  score: 0,
  message: "Will the next card be higher or lower?",
  status: "playing",
  flipping: false,
  guess: (dir) => {
    const { current, status } = get();
    if (status !== "playing") return;
    const next = randomCard();
    set({ next, flipping: true });
    setTimeout(() => {
      let correct = false;
      if (dir === "high" && next.rank > current.rank) correct = true;
      else if (dir === "low" && next.rank < current.rank) correct = true;
      else if (dir === "same" && next.rank === current.rank) correct = true;
      if (correct) {
        const newStreak = get().streak + 1;
        const bonus = dir === "same" ? 10 : 1;
        const newScore = get().score + bonus;
        const newBest = Math.max(get().best, newStreak);
        if (newBest !== get().best) saveBest(newBest);
        set({
          current: next,
          next: null,
          streak: newStreak,
          score: newScore,
          best: newBest,
          message: `Correct! +${bonus} point${bonus > 1 ? "s" : ""}`,
          flipping: false,
        });
      } else {
        set({
          status: "lost",
          message: `Wrong! The card was ${rankLabel(next.rank)}${next.suit}`,
          flipping: false,
        });
      }
    }, 500);
  },
  reset: () => {
    set({
      current: randomCard(),
      next: null,
      streak: 0,
      score: 0,
      message: "Will the next card be higher or lower?",
      status: "playing",
      flipping: false,
    });
  },
}));
