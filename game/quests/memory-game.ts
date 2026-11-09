export const GRANDPA_QUEST = 'grandpa-memory';
export const MEMORY_REWARD = 150;
export const MEMORY_PAIRS = 8;
export const MEMORY_CARD_COUNT = MEMORY_PAIRS * 2;
// Good memory needs about 13 moves, so this leaves room for some mistakes, but not for luck alone.
export const MEMORY_MOVE_LIMIT = 20;

// Kept on the server, since the browser would otherwise know where every card is. A move is two
// flipped cards.
export type MemoryGame = {
  // The pair each position belongs to.
  faces: number[];
  found: number[];
  firstFlip: number | null;
  moves: number;
};

export type MemoryStatus = 'playing' | 'won' | 'lost';

export type MemoryFlip = {
  game: MemoryGame;
  face: number;
  // Set on a move's second card, once it is known whether the two cards match.
  isMatch: boolean | null;
  status: MemoryStatus;
};

export function dealMemoryGame(random: () => number = Math.random): MemoryGame {
  const faces = Array.from({ length: MEMORY_CARD_COUNT }, (_, position) =>
    Math.floor(position / 2),
  );
  for (let last = faces.length - 1; last > 0; last -= 1) {
    const other = Math.floor(random() * (last + 1));
    [faces[last], faces[other]] = [faces[other], faces[last]];
  }
  return { faces, found: [], firstFlip: null, moves: 0 };
}

// Null for a card that can't be flipped. The request comes from the browser, so it can be anything.
export function flipMemoryCard(game: MemoryGame, position: unknown): MemoryFlip | null {
  if (
    !Number.isInteger(position) ||
    (position as number) < 0 ||
    (position as number) >= game.faces.length ||
    game.found.includes(position as number) ||
    game.firstFlip === position
  ) {
    return null;
  }
  const flipped = position as number;
  const face = game.faces[flipped];

  if (game.firstFlip === null) {
    return { game: { ...game, firstFlip: flipped }, face, isMatch: null, status: 'playing' };
  }

  const isMatch = game.faces[game.firstFlip] === face;
  const found = isMatch ? [...game.found, game.firstFlip, flipped] : game.found;
  const moves = game.moves + 1;
  const status =
    found.length === game.faces.length ? 'won' : moves >= MEMORY_MOVE_LIMIT ? 'lost' : 'playing';

  return { game: { ...game, found, firstFlip: null, moves }, face, isMatch, status };
}
