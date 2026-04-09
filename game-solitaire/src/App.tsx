import { useState, useCallback, useEffect, useRef } from "react";

/* ── Types ── */
const SUITS = ["♠", "♥", "♦", "♣"] as const;
type Suit = typeof SUITS[number];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
type Rank = typeof RANKS[number];

interface Card { rank: Rank; suit: Suit; faceUp: boolean; id: string; }

function isRed(s: Suit) { return s === "♥" || s === "♦"; }
function rankIndex(r: Rank) { return RANKS.indexOf(r); }

function makeDeck(): Card[] {
  const d: Card[] = [];
  let id = 0;
  for (const s of SUITS) for (const r of RANKS) d.push({ rank: r, suit: s, faceUp: false, id: `c${id++}` });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}

interface GameState {
  tableau: Card[][];   // 7 columns
  foundation: Card[][]; // 4 piles (one per suit, built A->K)
  stock: Card[];
  waste: Card[];
}

function initGame(): GameState {
  const deck = makeDeck();
  const tableau: Card[][] = [];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    const pile: Card[] = [];
    for (let row = 0; row <= col; row++) {
      const card = deck[idx++];
      card.faceUp = row === col;
      pile.push(card);
    }
    tableau.push(pile);
  }
  const stock = deck.slice(idx).map(c => ({ ...c, faceUp: false }));
  return { tableau, foundation: [[], [], [], []], stock, waste: [] };
}

function getBestTime(): number { return Number(localStorage.getItem("solitaire-best") || "0"); }
function saveBestTime(t: number) {
  const best = getBestTime();
  if (best === 0 || t < best) localStorage.setItem("solitaire-best", String(t));
}

/* ── Card Component ── */
function CardView({ card, onClick, selected, style }: {
  card: Card | null; onClick?: () => void; selected?: boolean; style?: React.CSSProperties;
}) {
  if (!card) {
    return (
      <div onClick={onClick} style={style}
        className="w-12 h-[68px] rounded-md border border-dashed border-white/10 flex items-center justify-center text-white/10 text-xs cursor-pointer shrink-0">
        &empty;
      </div>
    );
  }
  if (!card.faceUp) {
    return (
      <div onClick={onClick} style={style}
        className="w-12 h-[68px] rounded-md bg-accent/80 border border-white/20 flex items-center justify-center cursor-pointer shrink-0">
        <span className="text-white/40 text-lg">?</span>
      </div>
    );
  }
  const red = isRed(card.suit);
  return (
    <div onClick={onClick} style={style}
      className={`w-12 h-[68px] rounded-md bg-white border-2 flex flex-col items-start justify-start p-0.5 cursor-pointer shrink-0 text-xs font-bold leading-tight
        ${selected ? "border-steel ring-2 ring-steel" : "border-white/30"}
        ${red ? "text-red-500" : "text-gray-800"}`}>
      <span>{card.rank}</span>
      <span className="text-sm">{card.suit}</span>
    </div>
  );
}

/* ── helpers ── */
function canPlaceOnTableau(card: Card, target: Card | undefined): boolean {
  if (!target) return card.rank === "K";
  if (!target.faceUp) return false;
  return isRed(card.suit) !== isRed(target.suit) && rankIndex(card.rank) === rankIndex(target.rank) - 1;
}

function canPlaceOnFoundation(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) return card.rank === "A";
  const top = pile[pile.length - 1];
  return card.suit === top.suit && rankIndex(card.rank) === rankIndex(top.rank) + 1;
}

export default function App() {
  const [game, setGame] = useState<GameState>(initGame);
  const [selected, setSelected] = useState<{ source: string; colIdx?: number; cardIdx?: number } | null>(null);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(true);
  const [won, setWon] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!running || won) return;
    intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, won]);

  const checkWin = useCallback((g: GameState) => {
    if (g.foundation.every(f => f.length === 13)) {
      setWon(true);
      setRunning(false);
      saveBestTime(timer);
    }
  }, [timer]);

  const newGame = useCallback(() => {
    setGame(initGame());
    setSelected(null);
    setTimer(0);
    setRunning(true);
    setWon(false);
  }, []);

  /* Draw from stock */
  const drawStock = useCallback(() => {
    setGame(prev => {
      if (prev.stock.length === 0) {
        // flip waste back to stock
        const newStock = [...prev.waste].reverse().map(c => ({ ...c, faceUp: false }));
        return { ...prev, stock: newStock, waste: [] };
      }
      const s = [...prev.stock];
      const w = [...prev.waste];
      const card = s.pop()!;
      card.faceUp = true;
      w.push(card);
      return { ...prev, stock: s, waste: w };
    });
    setSelected(null);
  }, []);

  /* Try to auto-move a card to foundation */
  const tryAutoFoundation = useCallback((card: Card, g: GameState): GameState | null => {
    for (let fi = 0; fi < 4; fi++) {
      if (canPlaceOnFoundation(card, g.foundation[fi])) {
        const newF = g.foundation.map((f, i) => i === fi ? [...f, card] : f);
        return { ...g, foundation: newF };
      }
    }
    return null;
  }, []);

  /* Handle click on waste top */
  const clickWaste = useCallback(() => {
    if (game.waste.length === 0) return;
    if (selected?.source === "waste") {
      setSelected(null);
      return;
    }
    setSelected({ source: "waste" });
  }, [game.waste, selected]);

  /* Handle click on tableau card */
  const clickTableau = useCallback((colIdx: number, cardIdx: number) => {
    const col = game.tableau[colIdx];
    const card = col[cardIdx];
    if (!card.faceUp) {
      // flip face-down card if it's the last
      if (cardIdx === col.length - 1) {
        setGame(prev => {
          const newT = prev.tableau.map((c, i) => {
            if (i !== colIdx) return c;
            const nc = [...c];
            nc[cardIdx] = { ...nc[cardIdx], faceUp: true };
            return nc;
          });
          return { ...prev, tableau: newT };
        });
      }
      return;
    }

    // If we have a selection, try to move
    if (selected) {
      setGame(prev => {
        const targetCol = prev.tableau[colIdx];
        const targetTop = targetCol[targetCol.length - 1];

        if (selected.source === "waste") {
          const topWaste = prev.waste[prev.waste.length - 1];
          if (!topWaste) return prev;
          if (canPlaceOnTableau(topWaste, targetTop)) {
            const newW = prev.waste.slice(0, -1);
            const newT = prev.tableau.map((c, i) => i === colIdx ? [...c, topWaste] : c);
            setSelected(null);
            return { ...prev, waste: newW, tableau: newT };
          }
          return prev;
        }

        if (selected.source === "tableau" && selected.colIdx !== undefined && selected.cardIdx !== undefined) {
          if (selected.colIdx === colIdx) { setSelected(null); return prev; }
          const srcCol = prev.tableau[selected.colIdx];
          const movingCards = srcCol.slice(selected.cardIdx);
          if (canPlaceOnTableau(movingCards[0], targetTop)) {
            const newSrc = srcCol.slice(0, selected.cardIdx);
            // flip new top if face down
            if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) {
              newSrc[newSrc.length - 1] = { ...newSrc[newSrc.length - 1], faceUp: true };
            }
            const newDst = [...targetCol, ...movingCards];
            const newT = prev.tableau.map((c, i) => {
              if (i === selected.colIdx) return newSrc;
              if (i === colIdx) return newDst;
              return c;
            });
            setSelected(null);
            const ng = { ...prev, tableau: newT };
            checkWin(ng);
            return ng;
          }
        }

        return prev;
      });
      setSelected(null);
      return;
    }

    // Double-click to auto-move to foundation
    if (cardIdx === col.length - 1) {
      setGame(prev => {
        const result = tryAutoFoundation(card, prev);
        if (result) {
          const newT = prev.tableau.map((c, i) => {
            if (i !== colIdx) return c;
            const nc = c.slice(0, -1);
            if (nc.length > 0 && !nc[nc.length - 1].faceUp) {
              nc[nc.length - 1] = { ...nc[nc.length - 1], faceUp: true };
            }
            return nc;
          });
          const ng = { ...result, tableau: newT };
          checkWin(ng);
          return ng;
        }
        return prev;
      });
    }

    setSelected({ source: "tableau", colIdx, cardIdx });
  }, [game, selected, tryAutoFoundation, checkWin]);

  /* Click foundation */
  const clickFoundation = useCallback((fi: number) => {
    if (!selected) return;
    setGame(prev => {
      if (selected.source === "waste") {
        const topWaste = prev.waste[prev.waste.length - 1];
        if (!topWaste || !canPlaceOnFoundation(topWaste, prev.foundation[fi])) return prev;
        const newW = prev.waste.slice(0, -1);
        const newF = prev.foundation.map((f, i) => i === fi ? [...f, topWaste] : f);
        const ng = { ...prev, waste: newW, foundation: newF };
        checkWin(ng);
        return ng;
      }
      if (selected.source === "tableau" && selected.colIdx !== undefined && selected.cardIdx !== undefined) {
        const srcCol = prev.tableau[selected.colIdx];
        if (selected.cardIdx !== srcCol.length - 1) return prev; // only top card
        const card = srcCol[selected.cardIdx];
        if (!canPlaceOnFoundation(card, prev.foundation[fi])) return prev;
        const newSrc = srcCol.slice(0, -1);
        if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) {
          newSrc[newSrc.length - 1] = { ...newSrc[newSrc.length - 1], faceUp: true };
        }
        const newT = prev.tableau.map((c, i) => i === selected.colIdx ? newSrc : c);
        const newF = prev.foundation.map((f, i) => i === fi ? [...f, card] : f);
        const ng = { ...prev, tableau: newT, foundation: newF };
        checkWin(ng);
        return ng;
      }
      return prev;
    });
    setSelected(null);
  }, [selected, checkWin]);

  /* Click on empty tableau slot */
  const clickEmptyTableau = useCallback((colIdx: number) => {
    if (!selected) return;
    setGame(prev => {
      if (selected.source === "waste") {
        const topWaste = prev.waste[prev.waste.length - 1];
        if (!topWaste || topWaste.rank !== "K") return prev;
        const newW = prev.waste.slice(0, -1);
        const newT = prev.tableau.map((c, i) => i === colIdx ? [topWaste] : c);
        setSelected(null);
        return { ...prev, waste: newW, tableau: newT };
      }
      if (selected.source === "tableau" && selected.colIdx !== undefined && selected.cardIdx !== undefined) {
        const srcCol = prev.tableau[selected.colIdx];
        const movingCards = srcCol.slice(selected.cardIdx);
        if (movingCards[0].rank !== "K") return prev;
        const newSrc = srcCol.slice(0, selected.cardIdx);
        if (newSrc.length > 0 && !newSrc[newSrc.length - 1].faceUp) {
          newSrc[newSrc.length - 1] = { ...newSrc[newSrc.length - 1], faceUp: true };
        }
        const newT = prev.tableau.map((c, i) => {
          if (i === selected.colIdx) return newSrc;
          if (i === colIdx) return [...movingCards];
          return c;
        });
        setSelected(null);
        return { ...prev, tableau: newT };
      }
      return prev;
    });
    setSelected(null);
  }, [selected]);

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const bestTime = getBestTime();

  return (
    <div className="flex flex-col items-center gap-2 p-2 w-full max-w-lg mx-auto">
      <div className="flex w-full justify-between items-center">
        <a href="/AlyraGames/" className="text-steel text-sm hover:underline">&larr; Hub</a>
        <h1 className="text-xl font-black text-steel">SOLITAIRE</h1>
        <button onClick={newGame} className="text-sm text-accent hover:underline">New Game</button>
      </div>

      <div className="flex gap-4 text-sm">
        <span>Time: <span className="text-steel">{fmtTime(timer)}</span></span>
        {bestTime > 0 && <span>Best: <span className="text-accent">{fmtTime(bestTime)}</span></span>}
      </div>

      {won && (
        <div className="text-2xl font-bold text-green-400 animate-pulse">You Win!</div>
      )}

      {/* Top row: stock, waste, foundations */}
      <div className="flex gap-2 w-full justify-between">
        <div className="flex gap-2">
          {/* Stock */}
          <div onClick={drawStock}>
            {game.stock.length > 0
              ? <CardView card={{ ...game.stock[game.stock.length - 1], faceUp: false }} />
              : <div className="w-12 h-[68px] rounded-md border border-dashed border-accent/40 flex items-center justify-center text-accent text-xs cursor-pointer" onClick={drawStock}>&#8634;</div>
            }
          </div>
          {/* Waste */}
          <div onClick={clickWaste}>
            {game.waste.length > 0
              ? <CardView card={game.waste[game.waste.length - 1]}
                  selected={selected?.source === "waste"} />
              : <CardView card={null} />
            }
          </div>
        </div>

        {/* Foundation */}
        <div className="flex gap-1">
          {game.foundation.map((pile, fi) => (
            <div key={fi} onClick={() => clickFoundation(fi)}>
              {pile.length > 0
                ? <CardView card={pile[pile.length - 1]} />
                : <div className="w-12 h-[68px] rounded-md border border-dashed border-green-600/40 flex items-center justify-center text-green-600/40 text-xs cursor-pointer">
                    {SUITS[fi]}
                  </div>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="flex gap-1 w-full mt-1" style={{ minHeight: 300 }}>
        {game.tableau.map((col, ci) => (
          <div key={ci} className="flex-1 relative" style={{ minHeight: 68 }}>
            {col.length === 0 ? (
              <div onClick={() => clickEmptyTableau(ci)}
                className="w-full h-[68px] rounded-md border border-dashed border-white/10 cursor-pointer" />
            ) : (
              col.map((card, idx) => (
                <div key={card.id}
                  style={{ position: "absolute", top: idx * (card.faceUp ? 22 : 8), zIndex: idx, width: "100%" }}
                  onClick={() => clickTableau(ci, idx)}>
                  <CardView card={card}
                    selected={selected?.source === "tableau" && selected.colIdx === ci && selected.cardIdx !== undefined && idx >= selected.cardIdx} />
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
