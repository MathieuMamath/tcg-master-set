// The great clean-up at Linden Park: the player walks along the park's path, pulling a little cart
// with three bins, paper, packaging and glass, and litter comes their way. When a piece is within
// reach, a press puts it into a bin. The right bin sorts it; the wrong one, or a piece left behind,
// is a mistake. The walk quickens as the shift goes on, and sorting pieces in a row earns a bonus
// every five.
//
// Everything follows from the seed and the presses, so that the browser draws the same shift the
// server plays again: `simulateCleanup` is both. A press is a bin, from 0 to 2: it takes the piece
// within reach that came first.

import { seededRandom } from '../../seeded-random';
import type { ShiftAction } from './shifts';

export const BINS = ['paper', 'packaging', 'glass'] as const;
export type Bin = (typeof BINS)[number];
export const CLEANUP_MISTAKE_LIMIT = 3;
// Every this many pieces sorted in a row earns a bonus.
export const STREAK = 5;
export const STREAK_BONUS = 2;
// A piece is within reach from a little before it meets the player to a little after.
export const REACH_BEFORE_MS = 500;
export const REACH_AFTER_MS = 250;

// What a piece of litter looks like, by its bin.
export const LITTER_LOOKS = {
  paper: ['newspaper', 'crumpledPaper'],
  packaging: ['can', 'plasticBottle'],
  glass: ['jar', 'glassBottle'],
} as const satisfies Record<Bin, readonly string[]>;
export type LitterLook = (typeof LITTER_LOOKS)[Bin][number];

export type Litter = {
  bin: Bin;
  look: LitterLook;
  // When it meets the player, and how long it takes to come from the far end of the path.
  at: number;
  travel: number;
};

// The litter along the path, closer together and coming faster as the shift goes on.
export function parkLitter(seed: number, count = 120): Litter[] {
  const random = seededRandom(seed ^ 0xc1ea);
  let at = 2200;
  return Array.from({ length: count }, (_, index) => {
    const bin = BINS[Math.floor(random() * BINS.length)];
    const looks = LITTER_LOOKS[bin];
    const piece = {
      bin,
      look: looks[Math.floor(random() * looks.length)],
      at,
      travel: Math.max(1500, 2600 - index * 25),
    };
    at += Math.max(820, 1500 - index * 16) + Math.floor(random() * 300);
    return piece;
  });
}

export type CleanupMoment = {
  kind: 'sorted' | 'streak' | 'wrongBin' | 'missed';
  at: number;
  // The piece it is about, by its index, and the bin it went into.
  litter: number;
  bin?: Bin;
};

export type CleanupState = {
  now: number;
  // The pieces dealt with, in order: all before this index are sorted, in the wrong bin, or missed.
  next: number;
  sorted: number;
  streak: number;
  bonus: number;
  mistakes: number;
  moments: CleanupMoment[];
  endedAt: number | null;
};

function freshCleanup(): CleanupState {
  return {
    now: 0,
    next: 0,
    sorted: 0,
    streak: 0,
    bonus: 0,
    mistakes: 0,
    moments: [],
    endedAt: null,
  };
}

export function cleanupPoints(state: Pick<CleanupState, 'sorted' | 'bonus'>): number {
  return state.sorted + state.bonus;
}

function addMistake(state: CleanupState, moment: CleanupMoment) {
  state.mistakes += 1;
  state.streak = 0;
  state.moments.push(moment);
  if (state.mistakes >= CLEANUP_MISTAKE_LIMIT && state.endedAt === null) {
    state.endedAt = moment.at;
  }
}

// Plays the walk on until `to`: a piece the player walked past is missed.
function advance(state: CleanupState, litter: readonly Litter[], to: number) {
  while (state.endedAt === null && state.next < litter.length) {
    const passedAt = litter[state.next].at + REACH_AFTER_MS;
    if (passedAt > to) {
      break;
    }
    addMistake(state, { kind: 'missed', at: passedAt, litter: state.next });
    state.next += 1;
  }
  state.now = state.endedAt === null ? to : Math.min(to, state.endedAt);
}

// The piece within reach now, by its index, if any.
export function inReach(state: CleanupState, litter: readonly Litter[]): number | null {
  const piece = litter[state.next];
  return piece && state.now >= piece.at - REACH_BEFORE_MS ? state.next : null;
}

// Whether a press would do something now, for the browser to send only those.
export function canSort(state: CleanupState, litter: readonly Litter[]): boolean {
  return state.endedAt === null && inReach(state, litter) !== null;
}

function sort(state: CleanupState, litter: readonly Litter[], choice: number): boolean {
  const index = inReach(state, litter);
  if (state.endedAt !== null || index === null || !Number.isInteger(choice)) {
    return false;
  }
  const bin = BINS[choice];
  if (!bin) {
    return false;
  }
  const at = state.now;
  state.next += 1;
  if (litter[index].bin !== bin) {
    addMistake(state, { kind: 'wrongBin', at, litter: index, bin });
    return true;
  }
  state.sorted += 1;
  state.streak += 1;
  state.moments.push({ kind: 'sorted', at, litter: index, bin });
  if (state.streak % STREAK === 0) {
    state.bonus += STREAK_BONUS;
    state.moments.push({ kind: 'streak', at, litter: index });
  }
  return true;
}

export function simulateCleanup(
  seed: number,
  presses: readonly ShiftAction[],
  until: number,
  litter: readonly Litter[] = parkLitter(seed),
): CleanupState | null {
  const state = freshCleanup();
  for (const [ms, choice] of presses) {
    advance(state, litter, ms);
    if (!sort(state, litter, choice)) {
      return null;
    }
  }
  advance(state, litter, Math.max(until, state.now));
  return state;
}
