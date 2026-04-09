import { create } from 'zustand';
import { TetrominoType, getShape, getWallKicks, generateBag, TETROMINO_COLORS } from './tetrominos';

export const COLS = 10;
export const ROWS = 20;

// Each cell is null (empty) or a color string
export type Board = (string | null)[][];

interface Piece {
  type: TetrominoType;
  x: number;
  y: number;
  rotation: number;
}

interface GameState {
  board: Board;
  currentPiece: Piece | null;
  nextPieces: TetrominoType[];
  holdPiece: TetrominoType | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  highScore: number;
  gameOver: boolean;
  paused: boolean;
  started: boolean;
  bag: TetrominoType[];

  // Actions
  startGame: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => boolean;
  rotate: () => void;
  hardDrop: () => void;
  hold: () => void;
  togglePause: () => void;
  tick: () => void;
  getGhostY: () => number;
  getDropInterval: () => number;
}

function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function isValidPosition(board: Board, type: TetrominoType, rotation: number, x: number, y: number): boolean {
  const shape = getShape(type, rotation);
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col;
        const newY = y + row;
        if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
        if (newY >= 0 && board[newY][newX] !== null) return false;
      }
    }
  }
  return true;
}

function lockPiece(board: Board, piece: Piece): Board {
  const newBoard = board.map(row => [...row]);
  const shape = getShape(piece.type, piece.rotation);
  const color = TETROMINO_COLORS[piece.type];
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const bx = piece.x + col;
        const by = piece.y + row;
        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
          newBoard[by][bx] = color;
        }
      }
    }
  }
  return newBoard;
}

function clearLines(board: Board): { newBoard: Board; cleared: number } {
  const newBoard = board.filter(row => row.some(cell => cell === null));
  const cleared = ROWS - newBoard.length;
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(null));
  }
  return { newBoard, cleared };
}

function getScoreForLines(lines: number, level: number): number {
  const base = [0, 100, 300, 500, 800];
  return (base[lines] || 0) * (level + 1);
}

function loadHighScore(): number {
  try {
    return parseInt(localStorage.getItem('fallingblocks-highscore') || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number) {
  try {
    localStorage.setItem('fallingblocks-highscore', String(score));
  } catch {
    // ignore
  }
}

function pullFromBag(bag: TetrominoType[]): { piece: TetrominoType; bag: TetrominoType[] } {
  if (bag.length === 0) {
    bag = generateBag();
  }
  const [piece, ...rest] = bag;
  return { piece, bag: rest };
}

function spawnPiece(type: TetrominoType): Piece {
  const shape = getShape(type, 0);
  const x = Math.floor((COLS - shape[0].length) / 2);
  return { type, x, y: type === 'I' ? -1 : 0, rotation: 0 };
}

export const useGameStore = create<GameState>((set, get) => ({
  board: createEmptyBoard(),
  currentPiece: null,
  nextPieces: [],
  holdPiece: null,
  canHold: true,
  score: 0,
  lines: 0,
  level: 0,
  highScore: loadHighScore(),
  gameOver: false,
  paused: false,
  started: false,
  bag: [],

  startGame: () => {
    let bag = generateBag();
    const nextPieces: TetrominoType[] = [];

    // Get first piece + 3 next pieces
    const first = pullFromBag(bag);
    bag = first.bag;

    for (let i = 0; i < 3; i++) {
      const next = pullFromBag(bag);
      nextPieces.push(next.piece);
      bag = next.bag;
    }

    const piece = spawnPiece(first.piece);

    set({
      board: createEmptyBoard(),
      currentPiece: piece,
      nextPieces,
      holdPiece: null,
      canHold: true,
      score: 0,
      lines: 0,
      level: 0,
      gameOver: false,
      paused: false,
      started: true,
      bag,
    });
  },

  moveLeft: () => {
    const { board, currentPiece, gameOver, paused } = get();
    if (!currentPiece || gameOver || paused) return;
    if (isValidPosition(board, currentPiece.type, currentPiece.rotation, currentPiece.x - 1, currentPiece.y)) {
      set({ currentPiece: { ...currentPiece, x: currentPiece.x - 1 } });
    }
  },

  moveRight: () => {
    const { board, currentPiece, gameOver, paused } = get();
    if (!currentPiece || gameOver || paused) return;
    if (isValidPosition(board, currentPiece.type, currentPiece.rotation, currentPiece.x + 1, currentPiece.y)) {
      set({ currentPiece: { ...currentPiece, x: currentPiece.x + 1 } });
    }
  },

  moveDown: () => {
    const { board, currentPiece, gameOver, paused, score, lines, level, nextPieces, highScore } = get();
    if (!currentPiece || gameOver || paused) return false;

    if (isValidPosition(board, currentPiece.type, currentPiece.rotation, currentPiece.x, currentPiece.y + 1)) {
      set({ currentPiece: { ...currentPiece, y: currentPiece.y + 1 } });
      return true;
    }

    // Lock the piece
    let newBoard = lockPiece(board, currentPiece);
    const { newBoard: clearedBoard, cleared } = clearLines(newBoard);
    newBoard = clearedBoard;

    const addScore = getScoreForLines(cleared, level);
    const newLines = lines + cleared;
    const newLevel = Math.floor(newLines / 10);
    const newScore = score + addScore;
    const newHighScore = Math.max(highScore, newScore);

    if (newHighScore > highScore) {
      saveHighScore(newHighScore);
    }

    // Spawn next piece
    let bag = get().bag;
    const nextType = nextPieces[0];
    const remainingNext = nextPieces.slice(1);

    // Refill next queue
    const pulled = pullFromBag(bag);
    remainingNext.push(pulled.piece);
    bag = pulled.bag;

    const newPiece = spawnPiece(nextType);

    // Check game over
    if (!isValidPosition(newBoard, newPiece.type, newPiece.rotation, newPiece.x, newPiece.y)) {
      set({
        board: newBoard,
        currentPiece: null,
        score: newScore,
        lines: newLines,
        level: newLevel,
        highScore: newHighScore,
        gameOver: true,
        nextPieces: remainingNext,
        bag,
      });
      return false;
    }

    set({
      board: newBoard,
      currentPiece: newPiece,
      score: newScore,
      lines: newLines,
      level: newLevel,
      highScore: newHighScore,
      canHold: true,
      nextPieces: remainingNext,
      bag,
    });
    return false;
  },

  rotate: () => {
    const { board, currentPiece, gameOver, paused } = get();
    if (!currentPiece || gameOver || paused) return;

    const fromRot = currentPiece.rotation;
    const toRot = (fromRot + 1) % 4;
    const kicks = getWallKicks(currentPiece.type, fromRot, toRot);

    for (const [dx, dy] of kicks) {
      if (isValidPosition(board, currentPiece.type, toRot, currentPiece.x + dx, currentPiece.y - dy)) {
        set({
          currentPiece: {
            ...currentPiece,
            rotation: toRot,
            x: currentPiece.x + dx,
            y: currentPiece.y - dy,
          },
        });
        return;
      }
    }
  },

  hardDrop: () => {
    const { board, currentPiece, gameOver, paused, score } = get();
    if (!currentPiece || gameOver || paused) return;

    let dropY = currentPiece.y;
    while (isValidPosition(board, currentPiece.type, currentPiece.rotation, currentPiece.x, dropY + 1)) {
      dropY++;
    }

    const dropDistance = dropY - currentPiece.y;
    set({
      currentPiece: { ...currentPiece, y: dropY },
      score: score + dropDistance * 2,
    });

    // Force lock
    get().moveDown();
  },

  hold: () => {
    const { currentPiece, holdPiece, canHold, gameOver, paused, nextPieces, board } = get();
    if (!currentPiece || !canHold || gameOver || paused) return;

    if (holdPiece === null) {
      // Take from next queue
      let bag = get().bag;
      const nextType = nextPieces[0];
      const remainingNext = nextPieces.slice(1);
      const pulled = pullFromBag(bag);
      remainingNext.push(pulled.piece);
      bag = pulled.bag;

      const newPiece = spawnPiece(nextType);
      if (!isValidPosition(board, newPiece.type, newPiece.rotation, newPiece.x, newPiece.y)) {
        return;
      }

      set({
        holdPiece: currentPiece.type,
        currentPiece: newPiece,
        canHold: false,
        nextPieces: remainingNext,
        bag,
      });
    } else {
      const newPiece = spawnPiece(holdPiece);
      if (!isValidPosition(board, newPiece.type, newPiece.rotation, newPiece.x, newPiece.y)) {
        return;
      }

      set({
        holdPiece: currentPiece.type,
        currentPiece: newPiece,
        canHold: false,
      });
    }
  },

  togglePause: () => {
    const { gameOver, started } = get();
    if (gameOver || !started) return;
    set(state => ({ paused: !state.paused }));
  },

  tick: () => {
    get().moveDown();
  },

  getGhostY: () => {
    const { board, currentPiece } = get();
    if (!currentPiece) return 0;

    let ghostY = currentPiece.y;
    while (isValidPosition(board, currentPiece.type, currentPiece.rotation, currentPiece.x, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  },

  getDropInterval: () => {
    const { level } = get();
    // Classic NES-style speed curve
    const speeds = [800, 720, 630, 550, 470, 380, 300, 220, 140, 100, 80, 80, 80, 70, 70, 70, 50, 50, 50, 30];
    return speeds[Math.min(level, speeds.length - 1)] || 30;
  },
}));
