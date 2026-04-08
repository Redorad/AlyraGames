import { Gem, GemType, Position, MatchResult } from '../types';
import { GEM_TYPES } from '../data/gems';

const ROWS = 8;
const COLS = 8;

let nextId = 1;

export function getRows() { return ROWS; }
export function getCols() { return COLS; }

function randomGemType(): GemType {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

function createGem(row: number, col: number, type?: GemType): Gem {
  return {
    id: nextId++,
    type: type ?? randomGemType(),
    special: 'none',
    row,
    col,
  };
}

export function createBoard(): Gem[][] {
  const board: Gem[][] = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      let gem = createGem(r, c);
      while (hasInitialMatch(board, r, c, gem.type)) {
        gem = createGem(r, c);
      }
      board[r][c] = gem;
    }
  }
  return board;
}

function hasInitialMatch(board: Gem[][], row: number, col: number, type: GemType): boolean {
  if (col >= 2 && board[row][col - 1]?.type === type && board[row][col - 2]?.type === type) return true;
  if (row >= 2 && board[row - 1]?.[col]?.type === type && board[row - 2]?.[col]?.type === type) return true;
  return false;
}

export function cloneBoard(board: Gem[][]): Gem[][] {
  return board.map(row => row.map(gem => ({ ...gem })));
}

export function swapGems(board: Gem[][], pos1: Position, pos2: Position): Gem[][] {
  const newBoard = cloneBoard(board);
  const gem1 = newBoard[pos1.row][pos1.col];
  const gem2 = newBoard[pos2.row][pos2.col];
  gem1.row = pos2.row; gem1.col = pos2.col;
  gem2.row = pos1.row; gem2.col = pos1.col;
  newBoard[pos1.row][pos1.col] = gem2;
  newBoard[pos2.row][pos2.col] = gem1;
  return newBoard;
}

export function areAdjacent(pos1: Position, pos2: Position): boolean {
  const dr = Math.abs(pos1.row - pos2.row);
  const dc = Math.abs(pos1.col - pos2.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

export function findMatches(board: Gem[][]): MatchResult[] {
  const matches: MatchResult[] = [];

  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const type = board[r][c].type;
      let end = c + 1;
      while (end < COLS && board[r][end].type === type) end++;
      if (end - c >= 3) {
        const positions: Position[] = [];
        for (let i = c; i < end; i++) positions.push({ row: r, col: i });
        matches.push({ positions, isHorizontal: true, length: end - c });
      }
      c = end;
    }
  }

  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const type = board[r][c].type;
      let end = r + 1;
      while (end < ROWS && board[end][c].type === type) end++;
      if (end - r >= 3) {
        const positions: Position[] = [];
        for (let i = r; i < end; i++) positions.push({ row: i, col: c });
        matches.push({ positions, isHorizontal: false, length: end - r });
      }
      r = end;
    }
  }

  return matches;
}

export function hasAnyMatch(board: Gem[][]): boolean {
  return findMatches(board).length > 0;
}

function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

/**
 * Resolve matches with IMMEDIATE bonus activation:
 * - Match 3: normal (10pts each)
 * - Match 4: clears entire row or column (+50 bonus)
 * - Match 5+: clears ALL gems of that color (+100 bonus)
 */
export function resolveMatches(board: Gem[][]): {
  board: Gem[][];
  score: number;
  hadMatch: boolean;
  matchedPositions: Set<string>;
  bonusType: 'none' | 'line' | 'color';
} {
  const matches = findMatches(board);
  if (matches.length === 0) {
    return { board, score: 0, hadMatch: false, matchedPositions: new Set(), bonusType: 'none' };
  }

  const newBoard = cloneBoard(board);
  const allDestroyed = new Set<string>();
  let totalScore = 0;
  let bonusType: 'none' | 'line' | 'color' = 'none';

  for (const match of matches) {
    // Add base matched positions
    for (const pos of match.positions) {
      allDestroyed.add(posKey(pos.row, pos.col));
    }
    totalScore += match.length * 10;

    // Match 4: line clear — destroy entire row or column
    if (match.length === 4) {
      bonusType = 'line';
      totalScore += 50;
      const centerPos = match.positions[2];
      if (match.isHorizontal) {
        // Clear entire row
        for (let c = 0; c < COLS; c++) {
          allDestroyed.add(posKey(centerPos.row, c));
        }
      } else {
        // Clear entire column
        for (let r = 0; r < ROWS; r++) {
          allDestroyed.add(posKey(r, centerPos.col));
        }
      }
    }

    // Match 5+: color bomb — destroy all gems of that color
    if (match.length >= 5) {
      bonusType = 'color';
      totalScore += 100;
      const matchType = newBoard[match.positions[0].row][match.positions[0].col].type;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (newBoard[r][c].type === matchType) {
            allDestroyed.add(posKey(r, c));
          }
        }
      }
    }
  }

  // Add score for bonus-destroyed gems (beyond the base match)
  const baseMatchCount = matches.reduce((sum, m) => sum + m.positions.length, 0);
  const bonusDestroyed = allDestroyed.size - baseMatchCount;
  if (bonusDestroyed > 0) {
    totalScore += bonusDestroyed * 5;
  }

  // Remove all destroyed gems
  for (const key of allDestroyed) {
    const [r, c] = key.split(',').map(Number);
    newBoard[r][c] = { ...newBoard[r][c], id: -1 };
  }

  // Apply gravity
  for (let c = 0; c < COLS; c++) {
    const remaining: Gem[] = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][c].id !== -1) {
        remaining.push(newBoard[r][c]);
      }
    }
    let writeRow = ROWS - 1;
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].row = writeRow;
      remaining[i].col = c;
      newBoard[writeRow][c] = remaining[i];
      writeRow--;
    }
    while (writeRow >= 0) {
      newBoard[writeRow][c] = createGem(writeRow, c);
      writeRow--;
    }
  }

  return { board: newBoard, score: totalScore, hadMatch: true, matchedPositions: allDestroyed, bonusType };
}

export function hasValidMoves(board: Gem[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c < COLS - 1) {
        const swapped = swapGems(board, { row: r, col: c }, { row: r, col: c + 1 });
        if (hasAnyMatch(swapped)) return true;
      }
      if (r < ROWS - 1) {
        const swapped = swapGems(board, { row: r, col: c }, { row: r + 1, col: c });
        if (hasAnyMatch(swapped)) return true;
      }
    }
  }
  return false;
}

export function shuffleBoard(board: Gem[][]): Gem[][] {
  const flat = board.flat().map(g => g.type);
  for (let i = flat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flat[i], flat[j]] = [flat[j], flat[i]];
  }
  const newBoard: Gem[][] = [];
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    newBoard[r] = [];
    for (let c = 0; c < COLS; c++) {
      newBoard[r][c] = createGem(r, c, flat[idx++]);
    }
  }
  if (hasAnyMatch(newBoard) || !hasValidMoves(newBoard)) return createBoard();
  return newBoard;
}
