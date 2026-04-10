import { create } from "zustand";
import { useEffect } from "react";

type CellState = "empty" | "ship" | "hit" | "miss" | "sunk";

interface Ship {
  name: string;
  size: number;
  positions: { r: number; c: number }[];
  sunk: boolean;
}

interface GameState {
  phase: "placing" | "playing" | "gameover";
  playerGrid: CellState[][];
  aiGrid: CellState[][];
  playerShips: Ship[];
  aiShips: Ship[];
  currentShipIdx: number;
  horizontal: boolean;
  hoverCells: { r: number; c: number }[];
  winner: "player" | "ai" | null;
  message: string;
  highScore: number;
  wins: number;
  init: () => void;
  toggleDir: () => void;
  hoverPlace: (r: number, c: number) => void;
  clearHover: () => void;
  placeShip: (r: number, c: number) => void;
  fire: (r: number, c: number) => void;
}

const SHIP_DEFS = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

function makeGrid(): CellState[][] {
  return Array.from({ length: 10 }, () => Array(10).fill("empty"));
}

function canPlace(grid: CellState[][], r: number, c: number, size: number, horiz: boolean): { r: number; c: number }[] | null {
  const cells: { r: number; c: number }[] = [];
  for (let i = 0; i < size; i++) {
    const nr = horiz ? r : r + i;
    const nc = horiz ? c + i : c;
    if (nr < 0 || nr >= 10 || nc < 0 || nc >= 10 || grid[nr][nc] !== "empty") return null;
    cells.push({ r: nr, c: nc });
  }
  return cells;
}

function placeShipsRandomly(grid: CellState[][]): Ship[] {
  const ships: Ship[] = [];
  for (const def of SHIP_DEFS) {
    let placed = false;
    while (!placed) {
      const horiz = Math.random() < 0.5;
      const r = Math.floor(Math.random() * 10);
      const c = Math.floor(Math.random() * 10);
      const cells = canPlace(grid, r, c, def.size, horiz);
      if (cells) {
        for (const cell of cells) grid[cell.r][cell.c] = "ship";
        ships.push({ name: def.name, size: def.size, positions: cells, sunk: false });
        placed = true;
      }
    }
  }
  return ships;
}

function checkSunk(ship: Ship, grid: CellState[][]): boolean {
  return ship.positions.every((p) => grid[p.r][p.c] === "hit" || grid[p.r][p.c] === "sunk");
}

const useStore = create<GameState>((set, get) => ({
  phase: "placing",
  playerGrid: makeGrid(),
  aiGrid: makeGrid(),
  playerShips: [],
  aiShips: [],
  currentShipIdx: 0,
  horizontal: true,
  hoverCells: [],
  winner: null,
  message: "Place your Carrier (5)",
  highScore: parseInt(localStorage.getItem("battleship-highscore") || "0"),
  wins: 0,

  init: () => {
    const aiGrid = makeGrid();
    const aiShips = placeShipsRandomly(aiGrid);
    set({
      phase: "placing",
      playerGrid: makeGrid(),
      aiGrid,
      playerShips: [],
      aiShips,
      currentShipIdx: 0,
      horizontal: true,
      hoverCells: [],
      winner: null,
      message: "Place your Carrier (5)",
    });
  },

  toggleDir: () => set((s) => ({ horizontal: !s.horizontal })),

  hoverPlace: (r, c) => {
    const { phase, currentShipIdx, horizontal, playerGrid } = get();
    if (phase !== "placing" || currentShipIdx >= SHIP_DEFS.length) return;
    const cells = canPlace(playerGrid, r, c, SHIP_DEFS[currentShipIdx].size, horizontal);
    set({ hoverCells: cells || [] });
  },

  clearHover: () => set({ hoverCells: [] }),

  placeShip: (r, c) => {
    const { phase, currentShipIdx, horizontal, playerGrid, playerShips } = get();
    if (phase !== "placing" || currentShipIdx >= SHIP_DEFS.length) return;
    const def = SHIP_DEFS[currentShipIdx];
    const cells = canPlace(playerGrid, r, c, def.size, horizontal);
    if (!cells) return;
    const grid = playerGrid.map((row) => [...row]);
    for (const cell of cells) grid[cell.r][cell.c] = "ship";
    const newShips = [...playerShips, { name: def.name, size: def.size, positions: cells, sunk: false }];
    const nextIdx = currentShipIdx + 1;
    const nextPhase = nextIdx >= SHIP_DEFS.length ? "playing" : "placing";
    const msg =
      nextPhase === "playing"
        ? "Fire at the enemy grid!"
        : `Place your ${SHIP_DEFS[nextIdx].name} (${SHIP_DEFS[nextIdx].size})`;
    set({
      playerGrid: grid,
      playerShips: newShips,
      currentShipIdx: nextIdx,
      hoverCells: [],
      phase: nextPhase,
      message: msg,
    });
  },

  fire: (r, c) => {
    const { phase, aiGrid, aiShips, winner } = get();
    if (phase !== "playing" || winner) return;
    if (aiGrid[r][c] === "hit" || aiGrid[r][c] === "miss" || aiGrid[r][c] === "sunk") return;

    const grid = aiGrid.map((row) => [...row]);
    const isHit = grid[r][c] === "ship";
    grid[r][c] = isHit ? "hit" : "miss";

    let msg = isHit ? "Hit!" : "Miss!";
    const ships = aiShips.map((s) => ({ ...s }));
    if (isHit) {
      for (const ship of ships) {
        if (!ship.sunk && checkSunk(ship, grid)) {
          ship.sunk = true;
          for (const p of ship.positions) grid[p.r][p.c] = "sunk";
          msg = `Sunk their ${ship.name}!`;
        }
      }
    }

    const allSunk = ships.every((s) => s.sunk);
    let w: "player" | "ai" | null = null;
    let wins = get().wins;
    let highScore = get().highScore;
    if (allSunk) {
      w = "player";
      wins++;
      if (wins > highScore) {
        highScore = wins;
        localStorage.setItem("battleship-highscore", String(highScore));
      }
      msg = "You win! All ships sunk!";
    }

    set({ aiGrid: grid, aiShips: ships, message: msg, winner: w, wins, highScore });

    if (!allSunk) {
      setTimeout(() => {
        const { playerGrid, playerShips } = get();
        const pg = playerGrid.map((row) => [...row]);
        // AI fires randomly at unhit cells
        const targets: { r: number; c: number }[] = [];
        for (let rr = 0; rr < 10; rr++)
          for (let cc = 0; cc < 10; cc++)
            if (pg[rr][cc] === "empty" || pg[rr][cc] === "ship") targets.push({ r: rr, c: cc });
        if (targets.length === 0) return;
        const t = targets[Math.floor(Math.random() * targets.length)];
        const wasShip = pg[t.r][t.c] === "ship";
        pg[t.r][t.c] = wasShip ? "hit" : "miss";

        let aiMsg = wasShip ? "AI hit your ship!" : "AI missed.";
        const ps = playerShips.map((s) => ({ ...s }));
        if (wasShip) {
          for (const ship of ps) {
            if (!ship.sunk && checkSunk(ship, pg)) {
              ship.sunk = true;
              for (const p of ship.positions) pg[p.r][p.c] = "sunk";
              aiMsg = `AI sunk your ${ship.name}!`;
            }
          }
        }

        const allPlayerSunk = ps.every((s) => s.sunk);
        if (allPlayerSunk) {
          set({ playerGrid: pg, playerShips: ps, message: "AI wins!", winner: "ai" });
        } else {
          set({ playerGrid: pg, playerShips: ps, message: aiMsg });
        }
      }, 500);
    }
  },
}));

function Grid({
  grid,
  onClick,
  onHover,
  onLeave,
  showShips,
  hoverCells,
  label,
}: {
  grid: CellState[][];
  onClick?: (r: number, c: number) => void;
  onHover?: (r: number, c: number) => void;
  onLeave?: () => void;
  showShips: boolean;
  hoverCells?: { r: number; c: number }[];
  label: string;
}) {
  const cellSize = "min(3.2vw, 32px)";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</div>
      <div
        className="grid grid-cols-10 gap-px bg-navy-700 border border-navy-700 rounded"
        onMouseLeave={onLeave}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isHover = hoverCells?.some((h) => h.r === r && h.c === c);
            let bg = "#111640";
            if (cell === "hit" || cell === "sunk") bg = "#ef4444";
            else if (cell === "miss") bg = "#374151";
            else if (showShips && cell === "ship") bg = "#4b5563";
            if (isHover) bg = "#2563eb";
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => onClick?.(r, c)}
                onMouseEnter={() => onHover?.(r, c)}
                className="cursor-pointer flex items-center justify-center"
                style={{ width: cellSize, height: cellSize, background: bg }}
              >
                {cell === "sunk" && <span className="text-xs">X</span>}
                {cell === "hit" && <span className="text-xs">*</span>}
                {cell === "miss" && <span className="text-xs opacity-50">.</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function App() {
  const store = useStore();

  useEffect(() => {
    store.init();
  }, []);

  const { phase, playerGrid, aiGrid, hoverCells, winner, message, highScore, wins } = store;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold text-steel">Battleship</h1>
      <div className="text-sm text-gray-300">{message}</div>

      <div className="flex gap-4 text-xs text-gray-400">
        <span>Wins: {wins}</span>
        <span className="text-accent">Best streak: {highScore}</span>
      </div>

      {phase === "placing" && (
        <button
          onClick={() => store.toggleDir()}
          className="px-4 py-1 text-sm bg-navy-700 text-steel rounded border border-steel/20 hover:border-steel/40"
        >
          Rotate ({store.horizontal ? "Horizontal" : "Vertical"})
        </button>
      )}

      <div className="flex flex-wrap gap-6 justify-center">
        <Grid
          grid={playerGrid}
          showShips={true}
          onClick={phase === "placing" ? (r, c) => store.placeShip(r, c) : undefined}
          onHover={phase === "placing" ? (r, c) => store.hoverPlace(r, c) : undefined}
          onLeave={phase === "placing" ? () => store.clearHover() : undefined}
          hoverCells={phase === "placing" ? hoverCells : []}
          label="Your Fleet"
        />
        <Grid
          grid={aiGrid}
          showShips={false}
          onClick={phase === "playing" && !winner ? (r, c) => store.fire(r, c) : undefined}
          hoverCells={[]}
          label="Enemy Waters"
        />
      </div>

      {winner && (
        <button
          onClick={() => store.init()}
          className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:opacity-90"
        >
          Play Again
        </button>
      )}
    </div>
  );
}
