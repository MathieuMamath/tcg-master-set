// Archery in the dojo's garden: ten arrows at a paper target, each aimed in two presses. A line
// sweeps across the target from side to side, and the first press holds it; then a line sweeps up
// and down, and the second press holds it and looses the arrow where the two lines cross. A pennant
// shows the wind, which carries the arrow sideways: the first line should be held off the centre by
// as much as the wind will bring it back. The lines sweep faster arrow after arrow. Each ring
// scores, and two bullseyes in a row earn a bonus.
//
// Everything follows from the seed and the presses, so that the browser draws the same shift the
// server plays again: `simulateArchery` is both. Every press is the same: aiming.

import { seededRandom } from '../../seeded-random';
import type { ShiftAction } from './shifts';

export const ARROWS = 10;
export const ARCHERY_ACTIONS = ['aim'] as const;

// The arrow's flight to the target, then the time to take the next one.
export const FLIGHT_MS = 450;
const NEXT_ARROW_MS = 1100;
const FIRST_ARROW_MS = 800;
// How far the lines sweep from the centre, in target radii, and how far the strongest wind carries
// an arrow.
export const SWEEP = 1;
const WIND_PUSH = 0.4;
// The rings, from the bullseye out, by their radius and their points.
export const RINGS = [
  { radius: 0.1, points: 10 },
  { radius: 0.24, points: 8 },
  { radius: 0.4, points: 6 },
  { radius: 0.6, points: 4 },
  { radius: 0.85, points: 2 },
] as const;
export const BULLSEYE_BONUS = 5;

export type ArrowSetup = {
  // From -1, blowing to the left, to 1, blowing to the right.
  wind: number;
  // How long each line takes to sweep there and back, and where in its sweep it starts, from 0 to 1.
  periodX: number;
  periodY: number;
  phaseX: number;
  phaseY: number;
};

// Each arrow's wind and sweeps: calm and slow for the first ones, then gustier and quicker.
export function arrowSetups(seed: number): ArrowSetup[] {
  const random = seededRandom(seed ^ 0xa770);
  return Array.from({ length: ARROWS }, (_, index) => {
    const strength = index < 2 ? 0.3 : Math.min(1, 0.45 + index * 0.06);
    return {
      wind: Math.round((random() * 2 - 1) * strength * 100) / 100,
      periodX: 2200 - index * 90 + Math.floor(random() * 200),
      periodY: 2000 - index * 80 + Math.floor(random() * 200),
      phaseX: random(),
      phaseY: random(),
    };
  });
}

// A line sweeping back and forth between -SWEEP and SWEEP, `elapsed` after it started.
function sweep(elapsed: number, period: number, phase: number): number {
  const cycle = (((elapsed / period + phase) % 1) + 1) % 1;
  return SWEEP * (cycle < 0.5 ? -1 + 4 * cycle : 3 - 4 * cycle);
}

// Where the side-to-side line is, for an arrow made ready at `readyAt`.
export function sweepX(setup: ArrowSetup, readyAt: number, now: number): number {
  return sweep(now - readyAt, setup.periodX, setup.phaseX);
}

// Where the up-and-down line is, from the moment the first line was held: up is positive.
export function sweepY(setup: ArrowSetup, heldAt: number, now: number): number {
  return sweep(now - heldAt, setup.periodY, setup.phaseY);
}

// Where the wind carries an arrow held at `x`.
export function windCarries(setup: ArrowSetup, x: number): number {
  return x + setup.wind * WIND_PUSH;
}

export function ringPoints(x: number, y: number): number {
  const distance = Math.hypot(x, y);
  return RINGS.find(({ radius }) => distance <= radius)?.points ?? 0;
}

export type Shot = {
  x: number;
  y: number;
  points: number;
  // When it left the bow.
  at: number;
};

export type ArcheryMoment = {
  kind: 'hit' | 'bullseye' | 'miss' | 'streak';
  at: number;
  points: number;
};

export type ArcheryState = {
  now: number;
  shots: Shot[];
  // The side-to-side line once held, and when, until the arrow leaves.
  heldX: { x: number; at: number } | null;
  score: number;
  bullseyes: number;
  streaks: number;
  // Archery has no mistakes, but every shift counts them.
  mistakes: number;
  moments: ArcheryMoment[];
  endedAt: number | null;
};

function freshArchery(): ArcheryState {
  return {
    now: 0,
    shots: [],
    heldX: null,
    score: 0,
    bullseyes: 0,
    streaks: 0,
    mistakes: 0,
    moments: [],
    endedAt: null,
  };
}

export function archeryPoints(state: Pick<ArcheryState, 'score'>): number {
  return state.score;
}

// When the next arrow is on the string: after the last one landed and the next was taken.
export function readyAt(state: ArcheryState): number | null {
  const last = state.shots.at(-1);
  if (state.shots.length >= ARROWS) {
    return null;
  }
  return last ? last.at + NEXT_ARROW_MS : FIRST_ARROW_MS;
}

function advance(state: ArcheryState, to: number) {
  state.now = state.endedAt === null ? to : Math.min(to, state.endedAt);
}

// Whether a press would do something now, for the browser to send only those.
export function canAim(state: ArcheryState): boolean {
  const ready = readyAt(state);
  return state.endedAt === null && ready !== null && state.now >= ready;
}

function aim(state: ArcheryState, setups: readonly ArrowSetup[]): boolean {
  if (!canAim(state)) {
    return false;
  }
  const at = state.now;
  const setup = setups[state.shots.length];
  const ready = readyAt(state) ?? at;
  if (state.heldX === null) {
    state.heldX = { x: sweepX(setup, ready, at), at };
    return true;
  }
  const x = windCarries(setup, state.heldX.x);
  const y = sweepY(setup, state.heldX.at, at);
  const points = ringPoints(x, y);
  const wasBullseye = state.shots.at(-1)?.points === RINGS[0].points;
  state.shots.push({ x, y, points, at });
  state.heldX = null;
  state.score += points;
  const landsAt = at + FLIGHT_MS;
  state.moments.push({
    kind: points === RINGS[0].points ? 'bullseye' : points > 0 ? 'hit' : 'miss',
    at: landsAt,
    points,
  });
  if (points === RINGS[0].points) {
    state.bullseyes += 1;
    if (wasBullseye) {
      state.streaks += 1;
      state.score += BULLSEYE_BONUS;
      state.moments.push({ kind: 'streak', at: landsAt, points: BULLSEYE_BONUS });
    }
  }
  if (state.shots.length >= ARROWS) {
    state.endedAt = landsAt;
  }
  return true;
}

export function simulateArchery(
  seed: number,
  presses: readonly ShiftAction[],
  until: number,
  setups: readonly ArrowSetup[] = arrowSetups(seed),
): ArcheryState | null {
  const state = freshArchery();
  for (const [ms] of presses) {
    advance(state, ms);
    if (!aim(state, setups)) {
      return null;
    }
  }
  advance(state, Math.max(until, state.now));
  return state;
}
