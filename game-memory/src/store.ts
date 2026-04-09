import { create } from 'zustand';

export type GridSize = '4x4' | '5x4' | '6x5';

export interface Card {
  id: number;
  emoji: string;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

export interface BestScore {
  moves: number;
  time: number;
  stars: number;
}

interface GameState {
  // Game config
  gridSize: GridSize;
  cols: number;
  rows: number;
  totalPairs: number;

  // Game state
  cards: Card[];
  flippedCards: number[];
  matchedPairs: number;
  moves: number;
  timer: number;
  timerRunning: boolean;
  gameStarted: boolean;
  gameWon: boolean;

  // Best scores per grid size
  bestScores: Record<GridSize, BestScore | null>;

  // Actions
  setGridSize: (size: GridSize) => void;
  startGame: () => void;
  flipCard: (id: number) => void;
  tick: () => void;
  resetGame: () => void;
  loadBestScores: () => void;
}

const ANIMAL_EMOJIS = [
  '\u{1F436}', '\u{1F431}', '\u{1F42D}', '\u{1F439}', '\u{1F430}', '\u{1F98A}',
  '\u{1F43B}', '\u{1F43C}', '\u{1F428}', '\u{1F42F}', '\u{1F981}', '\u{1F42E}',
  '\u{1F437}', '\u{1F438}', '\u{1F435}', '\u{1F984}', '\u{1F98B}'
];

const GRID_CONFIG: Record<GridSize, { cols: number; rows: number; pairs: number }> = {
  '4x4': { cols: 4, rows: 4, pairs: 8 },
  '5x4': { cols: 5, rows: 4, pairs: 10 },
  '6x5': { cols: 6, rows: 5, pairs: 15 },
};

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createCards(pairs: number): Card[] {
  const emojis = shuffle(ANIMAL_EMOJIS).slice(0, pairs);
  const cards: Card[] = [];

  emojis.forEach((emoji, index) => {
    cards.push({ id: index * 2, emoji, pairId: index, flipped: false, matched: false });
    cards.push({ id: index * 2 + 1, emoji, pairId: index, flipped: false, matched: false });
  });

  return shuffle(cards);
}

function getStars(moves: number, pairs: number): number {
  const perfectMoves = pairs;
  const ratio = moves / perfectMoves;
  if (ratio <= 1.5) return 3;
  if (ratio <= 2.5) return 2;
  return 1;
}

function loadScores(): Record<GridSize, BestScore | null> {
  try {
    const data = localStorage.getItem('memory-best-scores');
    if (data) return JSON.parse(data);
  } catch {}
  return { '4x4': null, '5x4': null, '6x5': null };
}

function saveScores(scores: Record<GridSize, BestScore | null>) {
  try {
    localStorage.setItem('memory-best-scores', JSON.stringify(scores));
  } catch {}
}

export const useGameStore = create<GameState>((set, get) => ({
  gridSize: '4x4',
  cols: 4,
  rows: 4,
  totalPairs: 8,

  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  moves: 0,
  timer: 0,
  timerRunning: false,
  gameStarted: false,
  gameWon: false,

  bestScores: loadScores(),

  setGridSize: (size) => {
    const config = GRID_CONFIG[size];
    set({
      gridSize: size,
      cols: config.cols,
      rows: config.rows,
      totalPairs: config.pairs,
    });
  },

  startGame: () => {
    const { totalPairs } = get();
    set({
      cards: createCards(totalPairs),
      flippedCards: [],
      matchedPairs: 0,
      moves: 0,
      timer: 0,
      timerRunning: false,
      gameStarted: false,
      gameWon: false,
    });
  },

  flipCard: (id) => {
    const state = get();
    const { cards, flippedCards, matchedPairs, totalPairs, moves, gridSize, bestScores, timer } = state;

    // Can't flip if already 2 cards flipped, card already flipped/matched
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched || flippedCards.length >= 2) return;

    const newCards = cards.map((c) =>
      c.id === id ? { ...c, flipped: true } : c
    );
    const newFlipped = [...flippedCards, id];

    // Start timer on first flip
    const isFirstFlip = !state.gameStarted;

    if (newFlipped.length === 2) {
      const first = newCards.find((c) => c.id === newFlipped[0])!;
      const second = newCards.find((c) => c.id === newFlipped[1])!;
      const newMoves = moves + 1;

      if (first.pairId === second.pairId) {
        // Match found
        const matchCards = newCards.map((c) =>
          c.pairId === first.pairId ? { ...c, matched: true } : c
        );
        const newMatchedPairs = matchedPairs + 1;
        const won = newMatchedPairs === totalPairs;

        if (won) {
          const stars = getStars(newMoves, totalPairs);
          const currentBest = bestScores[gridSize];
          const newTime = timer + (isFirstFlip ? 0 : 0);
          let newBestScores = bestScores;

          if (!currentBest || newMoves < currentBest.moves || (newMoves === currentBest.moves && newTime < currentBest.time)) {
            newBestScores = {
              ...bestScores,
              [gridSize]: { moves: newMoves, time: timer, stars },
            };
            saveScores(newBestScores);
          }

          set({
            cards: matchCards,
            flippedCards: [],
            matchedPairs: newMatchedPairs,
            moves: newMoves,
            gameWon: true,
            timerRunning: false,
            gameStarted: true,
            bestScores: newBestScores,
          });
        } else {
          set({
            cards: matchCards,
            flippedCards: [],
            matchedPairs: newMatchedPairs,
            moves: newMoves,
            gameStarted: true,
            timerRunning: true,
          });
        }
      } else {
        // No match - flip back after delay
        set({
          cards: newCards,
          flippedCards: newFlipped,
          moves: newMoves,
          gameStarted: true,
          timerRunning: true,
        });

        setTimeout(() => {
          const currentState = get();
          // Only flip back if these are still the flipped cards
          if (
            currentState.flippedCards.length === 2 &&
            currentState.flippedCards[0] === newFlipped[0] &&
            currentState.flippedCards[1] === newFlipped[1]
          ) {
            set({
              cards: currentState.cards.map((c) =>
                newFlipped.includes(c.id) && !c.matched ? { ...c, flipped: false } : c
              ),
              flippedCards: [],
            });
          }
        }, 800);
      }
    } else {
      // First card of pair
      set({
        cards: newCards,
        flippedCards: newFlipped,
        gameStarted: true,
        timerRunning: true,
      });
    }
  },

  tick: () => {
    const { timerRunning } = get();
    if (timerRunning) {
      set((s) => ({ timer: s.timer + 1 }));
    }
  },

  resetGame: () => {
    const { totalPairs } = get();
    set({
      cards: createCards(totalPairs),
      flippedCards: [],
      matchedPairs: 0,
      moves: 0,
      timer: 0,
      timerRunning: false,
      gameStarted: false,
      gameWon: false,
    });
  },

  loadBestScores: () => {
    set({ bestScores: loadScores() });
  },
}));

export { getStars };
