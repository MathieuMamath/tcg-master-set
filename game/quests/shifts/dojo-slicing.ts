// Slicing at the dojo: vegetables are thrown up from below in four lanes and fall back down. A
// stroke of the blade cuts the throws it aims at, never the others in their lanes: a swipe of the
// mouse or a finger those it passes through, and a key the one in its lane that was thrown first,
// which falls first. Cutting several at once makes a combo, and
// cutting one at the top of its flight is a clean cut. A clay pot is thrown now and then: cutting
// it breaks it, and a vegetable that lands uncut is lost. Those are mistakes.
//
// Everything follows from the seed and the strokes, so that the browser draws the same shift the
// server plays again: `simulateSlicing` is both.

import { seededRandom } from '../../seeded-random';
import type { ShiftAction } from './shifts';

export const SLICING_LANES = 4;
// No more than this many throws fly in a lane at once, so that a stroke can name each of them.
export const LANE_DEPTH = 2;
// A stroke names, in each lane, which of the throws in the air there it cuts, by the order they
// were thrown: two bits a lane, the first for the throw thrown first, the second for the next.
export const SLICING_STROKES = (1 << LANE_DEPTH) ** SLICING_LANES;
export const SLICING_MISTAKE_LIMIT = 3;

export const VEGETABLES = ['carrot', 'radish', 'pepper', 'eggplant', 'cabbage'] as const;
export type Vegetable = (typeof VEGETABLES)[number];
export type ThrownKind = Vegetable | 'pot';

// How close to the top of its flight a cut is clean, as a share of the flight.
const CLEAN_SHARE = 0.18;
// The first throws are vegetables only, to learn the gesture.
const FIRST_POT = 6;
const POT_CHANCE = 0.14;

export type Thrown = {
  lane: number;
  kind: ThrownKind;
  // When it leaves the bottom, and how long it stays in the air.
  at: number;
  air: number;
};

// The throws, closer together and quicker as the shift goes on, sometimes two at once. A pot never
// flies in a lane at the same time as a vegetable, so that a key never breaks one by surprise, and
// no more than two throws fly in a lane at once.
export function slicingThrows(seed: number, count = 160): Thrown[] {
  const random = seededRandom(seed ^ 0x51ce);
  const throws: Thrown[] = [];
  // A lane that is clear of the other kind for the whole flight, starting from the one drawn.
  const laneFor = (drawn: number, isPot: boolean, at: number, air: number) => {
    for (let step = 0; step < SLICING_LANES; step++) {
      const lane = (drawn + step) % SLICING_LANES;
      const flying = throws.filter(
        (other) => other.lane === lane && other.at < at + air && at < other.at + other.air,
      );
      const clashes = flying.some((other) => (other.kind === 'pot') !== isPot);
      if (!clashes && flying.length < LANE_DEPTH) {
        return lane;
      }
    }
    return null;
  };
  const add = (kind: ThrownKind, drawnLane: number, at: number, air: number) => {
    const lane = laneFor(drawnLane, kind === 'pot', at, air);
    if (lane !== null) {
      throws.push({ lane, kind, at, air });
    }
    return lane;
  };
  let at = 600;
  for (let index = 0; throws.length < count; index++) {
    const air = Math.max(1500, 2400 - index * 14) + Math.floor(random() * 300);
    const isPot = index >= FIRST_POT && random() < POT_CHANCE;
    const kind = isPot ? 'pot' : VEGETABLES[Math.floor(random() * VEGETABLES.length)];
    const lane = add(kind, Math.floor(random() * SLICING_LANES), at, air) ?? 0;
    // Now and then a second one, in another lane, for a combo.
    if (index >= 3 && random() < 0.3) {
      const other = (lane + 1 + Math.floor(random() * (SLICING_LANES - 1))) % SLICING_LANES;
      add(VEGETABLES[Math.floor(random() * VEGETABLES.length)], other, at + 120, air);
    }
    at += Math.max(420, 1150 - index * 13) + Math.floor(random() * 300);
  }
  return throws.slice(0, count);
}

// Where a throw is in its flight, from 0 when thrown to 1 when it lands: null when not in the air.
export function flightOf(thrown: Thrown, now: number): number | null {
  const share = (now - thrown.at) / thrown.air;
  return share >= 0 && share < 1 ? share : null;
}

// How high a throw is, from 0 at the bottom to 1 at the top of its flight.
export function heightOf(share: number): number {
  return 4 * share * (1 - share);
}

export type SlicingMoment = {
  kind: 'cut' | 'clean' | 'combo' | 'pot' | 'dropped';
  at: number;
  lane: number;
  // The vegetables cut by a combo.
  count?: number;
  // Which throw it was about.
  thrown?: number;
};

export type SlicingState = {
  now: number;
  // What happened to each throw, by its index: cut, broken, or landed.
  ends: Map<number, { kind: 'cut' | 'broken' | 'dropped'; at: number }>;
  cut: number;
  clean: number;
  combos: number;
  mistakes: number;
  moments: SlicingMoment[];
  endedAt: number | null;
};

function freshSlicing(): SlicingState {
  return {
    now: 0,
    ends: new Map(),
    cut: 0,
    clean: 0,
    combos: 0,
    mistakes: 0,
    moments: [],
    endedAt: null,
  };
}

export function slicingPoints(state: Pick<SlicingState, 'cut' | 'clean' | 'combos'>): number {
  return state.cut + state.clean + state.combos;
}

function addMistake(state: SlicingState, moment: SlicingMoment) {
  state.mistakes += 1;
  state.moments.push(moment);
  if (state.mistakes >= SLICING_MISTAKE_LIMIT && state.endedAt === null) {
    state.endedAt = moment.at;
  }
}

// The throws in the air now, by their index.
export function inAir(state: SlicingState, throws: readonly Thrown[]): number[] {
  const flying: number[] = [];
  for (let index = 0; index < throws.length && throws[index].at <= state.now; index++) {
    if (!state.ends.has(index) && flightOf(throws[index], state.now) !== null) {
      flying.push(index);
    }
  }
  return flying;
}

// Plays the throws on until `to`: a vegetable that lands uncut is lost, a pot just lands.
function advance(state: SlicingState, throws: readonly Thrown[], to: number) {
  if (state.endedAt !== null) {
    state.now = Math.min(to, state.endedAt);
    return;
  }
  const landings: number[] = [];
  for (let index = 0; index < throws.length && throws[index].at <= to; index++) {
    const thrown = throws[index];
    const landsAt = thrown.at + thrown.air;
    if (!state.ends.has(index) && landsAt <= to) {
      landings.push(index);
    }
  }
  landings.sort((first, second) => {
    const a = throws[first];
    const b = throws[second];
    return a.at + a.air - (b.at + b.air);
  });
  for (const index of landings) {
    const thrown = throws[index];
    const landsAt = thrown.at + thrown.air;
    state.ends.set(index, { kind: 'dropped', at: landsAt });
    if (thrown.kind !== 'pot') {
      addMistake(state, { kind: 'dropped', at: landsAt, lane: thrown.lane, thrown: index });
      if (state.endedAt !== null) {
        state.now = state.endedAt;
        return;
      }
    }
  }
  state.now = to;
}

// The throws in the air in a lane, in the order they were thrown.
function inLane(state: SlicingState, throws: readonly Thrown[], lane: number): number[] {
  return inAir(state, throws).filter((index) => throws[index].lane === lane);
}

// The stroke that cuts these throws, all in the air now.
export function strokeOf(
  state: SlicingState,
  throws: readonly Thrown[],
  targets: Iterable<number>,
): number {
  let stroke = 0;
  for (const index of targets) {
    const lane = throws[index].lane;
    const rank = inLane(state, throws, lane).indexOf(index);
    if (rank >= 0 && rank < LANE_DEPTH) {
      stroke |= 1 << (rank + lane * LANE_DEPTH);
    }
  }
  return stroke;
}

// The stroke of a key: the throw in its lane that was thrown first.
export function laneStroke(lane: number): number {
  return 1 << (lane * LANE_DEPTH);
}

// The throws a stroke cuts now, or null if it names one that isn't there.
export function targetsOf(
  state: SlicingState,
  throws: readonly Thrown[],
  stroke: number,
): number[] | null {
  if (!Number.isInteger(stroke) || stroke <= 0 || stroke >= SLICING_STROKES) {
    return null;
  }
  const targets: number[] = [];
  for (let lane = 0; lane < SLICING_LANES; lane++) {
    const flying = inLane(state, throws, lane);
    for (let rank = 0; rank < LANE_DEPTH; rank++) {
      if ((stroke & (1 << (rank + lane * LANE_DEPTH))) !== 0) {
        if (rank >= flying.length) {
          return null;
        }
        targets.push(flying[rank]);
      }
    }
  }
  return targets;
}

// Whether a stroke would cut something now, for the browser to send only those.
export function canCut(state: SlicingState, throws: readonly Thrown[], stroke: number): boolean {
  return state.endedAt === null && targetsOf(state, throws, stroke) !== null;
}

function cut(state: SlicingState, throws: readonly Thrown[], stroke: number): boolean {
  if (!canCut(state, throws, stroke)) {
    return false;
  }
  const at = state.now;
  const targets = targetsOf(state, throws, stroke) ?? [];
  let vegetables = 0;
  for (const index of targets) {
    const thrown = throws[index];
    if (thrown.kind === 'pot') {
      state.ends.set(index, { kind: 'broken', at });
      addMistake(state, { kind: 'pot', at, lane: thrown.lane, thrown: index });
      continue;
    }
    state.ends.set(index, { kind: 'cut', at });
    vegetables += 1;
    state.cut += 1;
    const share = flightOf(thrown, at) ?? 0;
    const isClean = Math.abs(share - 0.5) <= CLEAN_SHARE / 2;
    if (isClean) {
      state.clean += 1;
    }
    state.moments.push({ kind: isClean ? 'clean' : 'cut', at, lane: thrown.lane, thrown: index });
  }
  if (vegetables >= 2) {
    state.combos += vegetables - 1;
    state.moments.push({ kind: 'combo', at, lane: throws[targets[0]].lane, count: vegetables });
  }
  return true;
}

export function simulateSlicing(
  seed: number,
  presses: readonly ShiftAction[],
  until: number,
  throws: readonly Thrown[] = slicingThrows(seed),
): SlicingState | null {
  const state = freshSlicing();
  for (const [ms, stroke] of presses) {
    advance(state, throws, ms);
    if (state.endedAt !== null || !cut(state, throws, stroke)) {
      return null;
    }
  }
  advance(state, throws, Math.max(until, state.now));
  return state;
}
