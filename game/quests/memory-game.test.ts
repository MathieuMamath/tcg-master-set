import { describe, expect, test } from 'vitest';
import {
  dealMemoryGame,
  flipMemoryCard,
  MEMORY_CARD_COUNT,
  MEMORY_MOVE_LIMIT,
  MEMORY_PAIRS,
  type MemoryGame,
} from './memory-game';

// Pairs side by side: positions 0 and 1 match, 2 and 3 match, and so on.
function orderedGame(): MemoryGame {
  return {
    faces: Array.from({ length: MEMORY_CARD_COUNT }, (_, position) => Math.floor(position / 2)),
    found: [],
    firstFlip: null,
    moves: 0,
  };
}

function play(game: MemoryGame, first: number, second: number) {
  const opened = flipMemoryCard(game, first);
  if (!opened) {
    throw new Error(`Card ${first} can't be flipped`);
  }
  const answered = flipMemoryCard(opened.game, second);
  if (!answered) {
    throw new Error(`Card ${second} can't be flipped`);
  }
  return answered;
}

describe('dealMemoryGame', () => {
  test('deals every pair exactly twice', () => {
    const { faces } = dealMemoryGame();

    expect(faces).toHaveLength(16);
    for (let face = 0; face < MEMORY_PAIRS; face += 1) {
      expect(faces.filter((other) => other === face)).toHaveLength(2);
    }
  });

  test('deals a different board each time', () => {
    const boards = new Set(
      Array.from({ length: 20 }, () => JSON.stringify(dealMemoryGame().faces)),
    );

    expect(boards.size).toBeGreaterThan(1);
  });
});

describe('flipMemoryCard', () => {
  test('the first card of a move shows its face without counting a move', () => {
    const flip = flipMemoryCard({ ...orderedGame(), faces: [3, 3, ...orderedGame().faces] }, 0);

    expect(flip).toMatchObject({ face: 3, isMatch: null, status: 'playing' });
    expect(flip?.game.moves).toBe(0);
    expect(flip?.game.firstFlip).toBe(0);
  });

  test('two matching cards are found, and count as one move', () => {
    const flip = play(orderedGame(), 0, 1);

    expect(flip.isMatch).toBe(true);
    expect(flip.game).toMatchObject({ found: [0, 1], firstFlip: null, moves: 1 });
  });

  test('two different cards stay in play, and count as one move', () => {
    const flip = play(orderedGame(), 0, 2);

    expect(flip.isMatch).toBe(false);
    expect(flip.face).toBe(1);
    expect(flip.game).toMatchObject({ found: [], firstFlip: null, moves: 1 });
  });

  test.each([
    ['below the board', -1],
    ['past the board', MEMORY_CARD_COUNT],
    ['between two cards', 1.5],
    ['not a number', '1'],
    ['missing', undefined],
    ['a property name', 'constructor'],
  ])('refuses a position %s', (_, position) => {
    expect(flipMemoryCard(orderedGame(), position)).toBeNull();
  });

  test('refuses the card that is already face up', () => {
    const opened = flipMemoryCard(orderedGame(), 4);

    expect(opened && flipMemoryCard(opened.game, 4)).toBeNull();
  });

  test('refuses a card that was already found', () => {
    expect(flipMemoryCard(play(orderedGame(), 0, 1).game, 0)).toBeNull();
  });

  test('finding the last pair wins', () => {
    let flip = play(orderedGame(), 0, 1);
    for (let first = 2; first < MEMORY_CARD_COUNT; first += 2) {
      flip = play(flip.game, first, first + 1);
    }

    expect(flip.status).toBe('won');
    expect(flip.game.moves).toBe(MEMORY_PAIRS);
  });

  test('a game can still be won on the very last move', () => {
    const almostDone = {
      ...orderedGame(),
      found: Array.from({ length: MEMORY_CARD_COUNT - 2 }, (_, position) => position),
      moves: MEMORY_MOVE_LIMIT - 1,
    };

    expect(play(almostDone, 14, 15).status).toBe('won');
  });

  test('running out of moves loses', () => {
    let game = orderedGame();
    for (let move = 1; move < MEMORY_MOVE_LIMIT; move += 1) {
      const flip = play(game, 0, 2);
      expect(flip.status).toBe('playing');
      game = flip.game;
    }

    expect(play(game, 0, 2).status).toBe('lost');
  });
});
