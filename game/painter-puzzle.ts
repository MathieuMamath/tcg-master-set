// Pinceau's sliding puzzle at Linden Park: his painting of the lake, cut into a 3×3 grid with one
// piece missing, is mixed up, and the player slides the pieces back into place, by a click or a
// touch on a piece next to the gap, or by the arrow keys. A calm chore, once a day, with no clock:
// it pays a fixed reward, more when done in few moves.
//
// The mix comes from a seed, the moment the puzzle began, so that the server can find it again.
// The browser sends the moves, each the cell of the piece slid into the gap, and the server plays
// them again to check that the painting is whole.

import { seededRandom } from './seeded-random';

export const PUZZLE_QUEST = 'painter-puzzle';
export const PUZZLE_SIZE = 3;
export const PUZZLE_CELLS = PUZZLE_SIZE * PUZZLE_SIZE;
// The gap, where the last piece would go.
export const GAP = PUZZLE_CELLS - 1;
export const PUZZLE_REWARD = 150;
export const PUZZLE_QUICK_REWARD = 250;
export const PUZZLE_QUICK_MOVES = 40;
// How many random slides mix the painting up: a mix never needs more than this many moves.
const MIX_SLIDES = 24;
// No hand slides a piece quicker than this, and past this the attempt is stale.
const QUICKEST_MOVE_MS = 120;
const MAX_SECONDS = 1800;
const MAX_MOVES = 1000;

// The board: at each cell, the piece it holds, by the cell it belongs in, the gap being `GAP`.
export type Board = number[];

export function solvedBoard(): Board {
  return Array.from({ length: PUZZLE_CELLS }, (_, cell) => cell);
}

export function isSolved(board: readonly number[]): boolean {
  return board.every((piece, cell) => piece === cell);
}

// The cells next to a cell, across its sides.
export function neighbours(cell: number): number[] {
  const row = Math.floor(cell / PUZZLE_SIZE);
  const column = cell % PUZZLE_SIZE;
  return [
    row > 0 ? cell - PUZZLE_SIZE : -1,
    row < PUZZLE_SIZE - 1 ? cell + PUZZLE_SIZE : -1,
    column > 0 ? cell - 1 : -1,
    column < PUZZLE_SIZE - 1 ? cell + 1 : -1,
  ].filter((next) => next >= 0);
}

// Whether the piece at this cell can slide into the gap.
export function canSlide(board: readonly number[], cell: number): boolean {
  return (
    Number.isInteger(cell) &&
    cell >= 0 &&
    cell < PUZZLE_CELLS &&
    neighbours(board.indexOf(GAP)).includes(cell)
  );
}

// The board once the piece at this cell has slid into the gap.
export function slide(board: readonly number[], cell: number): Board {
  const gap = board.indexOf(GAP);
  const next = [...board];
  next[gap] = board[cell];
  next[cell] = GAP;
  return next;
}

// The piece an arrow key slides: the one on the far side of the gap, so that it moves the way the
// arrow points. Null when no piece is there.
export function cellForArrow(
  board: readonly number[],
  direction: 'up' | 'down' | 'left' | 'right',
): number | null {
  const gap = board.indexOf(GAP);
  const row = Math.floor(gap / PUZZLE_SIZE);
  const column = gap % PUZZLE_SIZE;
  switch (direction) {
    case 'up':
      return row < PUZZLE_SIZE - 1 ? gap + PUZZLE_SIZE : null;
    case 'down':
      return row > 0 ? gap - PUZZLE_SIZE : null;
    case 'left':
      return column < PUZZLE_SIZE - 1 ? gap + 1 : null;
    case 'right':
      return column > 0 ? gap - 1 : null;
  }
}

// The painting mixed up by random slides from its finished state, never undoing the last one, so
// that it can always be put back, and never left already finished.
export function mixedBoard(seed: number): Board {
  const random = seededRandom(seed ^ 0x7a9);
  for (;;) {
    let board = solvedBoard();
    let last = -1;
    for (let step = 0; step < MIX_SLIDES; step++) {
      const choices = neighbours(board.indexOf(GAP)).filter((cell) => cell !== last);
      const cell = choices[Math.floor(random() * choices.length)];
      last = board.indexOf(GAP);
      board = slide(board, cell);
    }
    if (!isSolved(board)) {
      return board;
    }
  }
}

export function puzzleSeed(startedAt: Date): number {
  return Math.floor(startedAt.getTime()) >>> 0;
}

// How many moves put the painting back together, or null if the moves can't be this puzzle's or
// leave it unfinished. The request comes from the browser, so it can be anything.
export function checkMoves(board: readonly number[], moves: unknown): number | null {
  if (!Array.isArray(moves) || moves.length === 0 || moves.length > MAX_MOVES) {
    return null;
  }
  let current: readonly number[] = board;
  for (const cell of moves) {
    if (!canSlide(current, cell)) {
      return null;
    }
    current = slide(current, cell);
  }
  return isSolved(current) ? moves.length : null;
}

export function puzzleCoins(moves: number): number {
  return moves <= PUZZLE_QUICK_MOVES ? PUZZLE_QUICK_REWARD : PUZZLE_REWARD;
}

// The puzzle took at least as long as its moves can be made, and not so long that it is stale.
export function canFinishPuzzle(startedAt: Date | null, now: Date, moves: number): boolean {
  if (!startedAt) {
    return false;
  }
  const ms = now.getTime() - startedAt.getTime();
  return ms >= moves * QUICKEST_MOVE_MS && ms <= MAX_SECONDS * 1000;
}
