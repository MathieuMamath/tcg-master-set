// Skipping stones on Linden Park's lake, with Papy Caillou: five pebbles, each thrown in two presses.
// A needle sweeps the angle, and the first press holds it; then a gauge sweeps the strength, and the
// second press throws. The closer both are to the right throw, the more the pebble skips. As on a real
// lake, the right throw is low and flat, about 20 degrees, the angle physicists measured as the best
// (Clanet and others, Nature, 2004), and past about 47 degrees a pebble no longer skips. The lake's
// wind moves the right angle a little, and the reeds lean with it. A throw of many skips earns a
// bonus.
//
// Everything follows from the seed and the presses, so that the browser draws the same shift the
// server plays again: `simulateStones` is both. Every press is the same: throwing.

import { seededRandom } from '../../seeded-random';
import type { ShiftAction } from './shifts';

export const PEBBLES = 5;
export const STONE_ACTIONS = ['throw'] as const;
// The most skips a perfect throw makes, and the bonus for a throw of at least `CHAMPION_SKIPS`.
export const MAX_SKIPS = 12;
export const CHAMPION_SKIPS = 10;
export const CHAMPION_BONUS = 3;
// The right strength, and how far off the angle and the strength may be and still skip.
export const BEST_STRENGTH = 0.8;
const ANGLE_SPREAD = 0.3;
const STRENGTH_SPREAD = 0.28;
// The right angle without wind, on the dial from flat (0) to upright (1): about 20 degrees.
export const CALM_ANGLE = 0.22;
// How far the strongest wind moves the right angle: about 9 degrees either way.
const WIND_SHIFT = 0.1;
// How long a pebble takes for each skip, then the time to pick up the next.
export const SKIP_MS = 160;
const NEXT_PEBBLE_MS = 900;
const FIRST_PEBBLE_MS = 800;

export type PebbleSetup = {
  // From -1 to 1, which way the wind moves the right angle.
  wind: number;
  // How long the needle and the gauge take to sweep there and back, and where they start.
  anglePeriod: number;
  strengthPeriod: number;
  anglePhase: number;
  strengthPhase: number;
};

// Each pebble's wind and sweeps: calm for the first, then breezier and quicker.
export function pebbleSetups(seed: number): PebbleSetup[] {
  const random = seededRandom(seed ^ 0x5701);
  return Array.from({ length: PEBBLES }, (_, index) => {
    const strength = index === 0 ? 0.2 : Math.min(1, 0.5 + index * 0.12);
    return {
      wind: Math.round((random() * 2 - 1) * strength * 100) / 100,
      anglePeriod: 2000 - index * 120 + Math.floor(random() * 200),
      strengthPeriod: 1600 - index * 100 + Math.floor(random() * 200),
      anglePhase: random(),
      strengthPhase: random(),
    };
  });
}

// A sweep back and forth between 0 and 1, `elapsed` after it started.
function sweep(elapsed: number, period: number, phase: number): number {
  const cycle = (((elapsed / period + phase) % 1) + 1) % 1;
  return cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
}

export function angleAt(setup: PebbleSetup, readyAt: number, now: number): number {
  return sweep(now - readyAt, setup.anglePeriod, setup.anglePhase);
}

export function strengthAt(setup: PebbleSetup, heldAt: number, now: number): number {
  return sweep(now - heldAt, setup.strengthPeriod, setup.strengthPhase);
}

// The right angle for a pebble, moved by its wind.
export function bestAngle(setup: PebbleSetup): number {
  return CALM_ANGLE + setup.wind * WIND_SHIFT;
}

// How many times a pebble thrown at this angle and strength skips.
export function skipsOf(setup: PebbleSetup, angle: number, strength: number): number {
  const angleShare = Math.max(0, 1 - Math.abs(angle - bestAngle(setup)) / ANGLE_SPREAD);
  const strengthShare = Math.max(0, 1 - Math.abs(strength - BEST_STRENGTH) / STRENGTH_SPREAD);
  return Math.round(MAX_SKIPS * angleShare * strengthShare);
}

export type Throw = {
  angle: number;
  strength: number;
  skips: number;
  at: number;
};

export type StonesMoment = {
  kind: 'skipped' | 'sank' | 'champion';
  at: number;
  skips: number;
};

export type StonesState = {
  now: number;
  throws: Throw[];
  // The angle once held, and when, until the pebble is thrown.
  heldAngle: { angle: number; at: number } | null;
  score: number;
  // Skipping stones has no mistakes, but every shift counts them.
  mistakes: number;
  moments: StonesMoment[];
  endedAt: number | null;
};

function freshStones(): StonesState {
  return {
    now: 0,
    throws: [],
    heldAngle: null,
    score: 0,
    mistakes: 0,
    moments: [],
    endedAt: null,
  };
}

export function stonesPoints(state: Pick<StonesState, 'score'>): number {
  return state.score;
}

// When a pebble lands for good, after its last skip.
export function landsAt(thrown: Throw): number {
  return thrown.at + Math.max(1, thrown.skips) * SKIP_MS;
}

// When the next pebble is in hand: after the last one sank and the next was picked up.
export function pebbleReadyAt(state: StonesState): number | null {
  const last = state.throws.at(-1);
  if (state.throws.length >= PEBBLES) {
    return null;
  }
  return last ? landsAt(last) + NEXT_PEBBLE_MS : FIRST_PEBBLE_MS;
}

// Whether a press would do something now, for the browser to send only those.
export function canThrow(state: StonesState): boolean {
  const ready = pebbleReadyAt(state);
  return state.endedAt === null && ready !== null && state.now >= ready;
}

function advance(state: StonesState, to: number) {
  state.now = state.endedAt === null ? to : Math.min(to, state.endedAt);
}

function press(state: StonesState, setups: readonly PebbleSetup[]): boolean {
  if (!canThrow(state)) {
    return false;
  }
  const at = state.now;
  const setup = setups[state.throws.length];
  const ready = pebbleReadyAt(state) ?? at;
  if (state.heldAngle === null) {
    state.heldAngle = { angle: angleAt(setup, ready, at), at };
    return true;
  }
  const angle = state.heldAngle.angle;
  const strength = strengthAt(setup, state.heldAngle.at, at);
  const skips = skipsOf(setup, angle, strength);
  const thrown = { angle, strength, skips, at };
  state.throws.push(thrown);
  state.heldAngle = null;
  state.score += skips;
  const sinks = landsAt(thrown);
  state.moments.push({ kind: skips > 0 ? 'skipped' : 'sank', at: sinks, skips });
  if (skips >= CHAMPION_SKIPS) {
    state.score += CHAMPION_BONUS;
    state.moments.push({ kind: 'champion', at: sinks, skips });
  }
  if (state.throws.length >= PEBBLES) {
    state.endedAt = sinks;
  }
  return true;
}

export function simulateStones(
  seed: number,
  presses: readonly ShiftAction[],
  until: number,
  setups: readonly PebbleSetup[] = pebbleSetups(seed),
): StonesState | null {
  const state = freshStones();
  for (const [ms] of presses) {
    advance(state, ms);
    if (!press(state, setups)) {
      return null;
    }
  }
  advance(state, Math.max(until, state.now));
  return state;
}
