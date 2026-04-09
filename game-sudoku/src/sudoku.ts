// Sudoku puzzle generation and solving engine

export type Board = (number | 0)[][];
export type Notes = Set<number>[][];
export type Difficulty = 'easy' | 'medium' | 'hard';

// Create an empty 9x9 board
function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

// Create empty notes grid
export function emptyNotes(): Notes {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );
}

// Clone a board
export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

// Clone notes
export function cloneNotes(notes: Notes): Notes {
  return notes.map(row => row.map(cell => new Set(cell)));
}

// Check if placing `num` at (row, col) is valid
function isValid(board: Board, row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

// Shuffle an array in place (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Fill a board completely using backtracking with randomization
function fillBoard(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(board, r, c, num)) {
            board[r][c] = num;
            if (fillBoard(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Count solutions (stop at 2 to check uniqueness)
function countSolutions(board: Board, limit: number = 2): number {
  let count = 0;

  function solve(): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, r, c, num)) {
              board[r][c] = num;
              if (solve()) return true;
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count >= limit;
  }

  solve();
  return count;
}

// Get difficulty parameters
function getClueCounts(difficulty: Difficulty): { min: number; max: number } {
  switch (difficulty) {
    case 'easy': return { min: 36, max: 42 };
    case 'medium': return { min: 28, max: 34 };
    case 'hard': return { min: 22, max: 27 };
  }
}

// Generate a puzzle with a unique solution
export function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  // Generate a complete valid board
  const solution = emptyBoard();
  fillBoard(solution);

  const puzzle = cloneBoard(solution);
  const { min, max } = getClueCounts(difficulty);
  const targetClues = min + Math.floor(Math.random() * (max - min + 1));
  const targetRemove = 81 - targetClues;

  // Create list of all positions and shuffle
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= targetRemove) break;

    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    const test = cloneBoard(puzzle);
    if (countSolutions(test) === 1) {
      removed++;
    } else {
      puzzle[r][c] = backup;
    }
  }

  return { puzzle, solution };
}

// Check if a value conflicts with the board at position (row, col)
export function getConflicts(board: Board, row: number, col: number): [number, number][] {
  const val = board[row][col];
  if (val === 0) return [];
  const conflicts: [number, number][] = [];

  // Row conflicts
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === val) {
      conflicts.push([row, c]);
    }
  }
  // Column conflicts
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === val) {
      conflicts.push([r, col]);
    }
  }
  // Box conflicts
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c] === val) {
        conflicts.push([r, c]);
      }
    }
  }

  return conflicts;
}

// Check if the board is complete and correct
export function isBoardComplete(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return false;
    }
  }
  // Verify no conflicts
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (getConflicts(board, r, c).length > 0) return false;
    }
  }
  return true;
}

// Find a cell that can be revealed as a hint
export function getHintCell(
  currentBoard: Board,
  solution: Board,
  givenCells: boolean[][]
): [number, number] | null {
  // Find empty or wrong cells
  const candidates: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!givenCells[r][c] && currentBoard[r][c] !== solution[r][c]) {
        candidates.push([r, c]);
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
