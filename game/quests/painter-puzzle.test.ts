import { describe, expect, test } from 'vitest';
import {
  canFinishPuzzle,
  canSlide,
  cellForArrow,
  checkMoves,
  GAP,
  isSolved,
  mixedBoard,
  neighbours,
  PUZZLE_QUICK_MOVES,
  PUZZLE_QUICK_REWARD,
  PUZZLE_REWARD,
  puzzleCoins,
  slide,
  solvedBoard,
} from './painter-puzzle';

const SEED = 20261109;

// The fewest moves that finish a board, each the cell of the piece slid, found by a breadth-first
// search over every board reachable from it.
function solve(board: readonly number[]): number[] {
  const start = board.join(',');
  const previous = new Map<string, { from: string; cell: number } | null>([[start, null]]);
  const queue: number[][] = [[...board]];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    const key = current.join(',');
    if (isSolved(current)) {
      const moves: number[] = [];
      let step = previous.get(key);
      let at = key;
      while (step) {
        moves.unshift(step.cell);
        at = step.from;
        step = previous.get(at);
      }
      return moves;
    }
    for (const cell of neighbours(current.indexOf(GAP))) {
      const next = slide(current, cell);
      const nextKey = next.join(',');
      if (!previous.has(nextKey)) {
        previous.set(nextKey, { from: key, cell });
        queue.push(next);
      }
    }
  }
  throw new Error('unsolvable');
}

describe('the painting', () => {
  test('is mixed up from the seed, never already whole, and can always be finished', () => {
    const board = mixedBoard(SEED);
    expect(board).toEqual(mixedBoard(SEED));
    expect([...board].sort()).toEqual(solvedBoard());
    expect(isSolved(board)).toBe(false);
    for (const seed of [1, 2, 3, 4, 5]) {
      expect(solve(mixedBoard(seed)).length).toBeLessThanOrEqual(24);
    }
  });

  test('slides only a piece next to the gap', () => {
    const board = solvedBoard();
    expect(canSlide(board, 7)).toBe(true);
    expect(canSlide(board, 5)).toBe(true);
    expect(canSlide(board, 4)).toBe(false);
    expect(canSlide(board, 9)).toBe(false);
    expect(slide(board, 7)).toEqual([0, 1, 2, 3, 4, 5, 6, GAP, 7]);
  });

  test('moves a piece the way the arrow points', () => {
    const board = solvedBoard();
    expect(cellForArrow(board, 'right')).toBe(7);
    expect(cellForArrow(board, 'down')).toBe(5);
    expect(cellForArrow(board, 'left')).toBeNull();
    expect(cellForArrow(board, 'up')).toBeNull();
  });
});

describe('finishing', () => {
  test('counts the moves that put the painting back, and pays more for few', () => {
    const board = mixedBoard(SEED);
    const moves = solve(board);
    expect(checkMoves(board, moves)).toBe(moves.length);
    expect(puzzleCoins(moves.length)).toBe(PUZZLE_QUICK_REWARD);
    expect(puzzleCoins(PUZZLE_QUICK_MOVES + 1)).toBe(PUZZLE_REWARD);
  });

  test('refuses moves that leave it unfinished, or that no one could make', () => {
    const board = mixedBoard(SEED);
    const moves = solve(board);
    expect(checkMoves(board, moves.slice(0, -1))).toBeNull();
    expect(checkMoves(board, [...moves.slice(0, -1), 99])).toBeNull();
    expect(checkMoves(board, 'nope')).toBeNull();
    expect(checkMoves(board, [])).toBeNull();
  });

  test('takes as long as its moves, and goes stale', () => {
    const startedAt = new Date(0);
    expect(canFinishPuzzle(null, new Date(10_000), 10)).toBe(false);
    expect(canFinishPuzzle(startedAt, new Date(500), 20)).toBe(false);
    expect(canFinishPuzzle(startedAt, new Date(30_000), 20)).toBe(true);
    expect(canFinishPuzzle(startedAt, new Date(7_200_000), 20)).toBe(false);
  });
});
