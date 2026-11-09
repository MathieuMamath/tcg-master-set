// Pop'Ballons at Bérénice's stand: balloons of four colours rise in four lanes, and Bérénice calls
// a colour, a new one every few seconds. A key or a lane's button pops the highest balloon of its
// lane, the next to float away, and a click or a touch pops the balloon it lands on: the called
// colour scores, any other is a mistake. The balloons rise faster as the shift goes on, and popping
// several of the called colour in a row earns a bonus every five. A balloon that floats away is
// simply gone.
//
// Everything follows from the seed and the presses, so that the browser draws the same shift the
// server plays again: `simulateBalloons` is both. A press is a lane, from 0 to 3, or a balloon
// touched, `BALLOON_LANES` plus its index.

import { seededRandom } from '../../seeded-random';
import type { ShiftAction } from './shifts';

export const BALLOON_LANES = 4;
export const BALLOON_COLORS = ['red', 'blue', 'yellow', 'green'] as const;
export type BalloonColor = (typeof BALLOON_COLORS)[number];
export const BALLOONS_MISTAKE_LIMIT = 3;
export const BALLOON_STREAK = 5;
export const BALLOON_STREAK_BONUS = 2;
const SHIFT_MS = 45_000;
// More than a shift ever sends up, so that a touch's press stays within the shift's choices.
export const MAX_BALLOONS = 200;
export const BALLOON_CHOICES = BALLOON_LANES + MAX_BALLOONS;

// The press that pops one balloon, touched rather than picked by its lane.
export function touchOf(balloon: number): number {
  return BALLOON_LANES + balloon;
}

export type Balloon = {
  lane: number;
  color: BalloonColor;
  // When it leaves the bottom, and how long it takes to float out at the top.
  at: number;
  rise: number;
};

export type BalloonCall = { color: BalloonColor; from: number };

// The colours Bérénice calls, a new one each time, sooner and sooner.
export function balloonCalls(seed: number): BalloonCall[] {
  const random = seededRandom(seed ^ 0xba11);
  const calls: BalloonCall[] = [];
  let from = 0;
  let color: BalloonColor = BALLOON_COLORS[Math.floor(random() * BALLOON_COLORS.length)];
  while (from < SHIFT_MS + 10_000) {
    calls.push({ color, from });
    from += Math.max(3500, 6000 - calls.length * 250);
    const others = BALLOON_COLORS.filter((other) => other !== color);
    color = others[Math.floor(random() * others.length)];
  }
  return calls;
}

export function calledAt(calls: readonly BalloonCall[], now: number): BalloonColor {
  let color = calls[0].color;
  for (const call of calls) {
    if (call.from > now) {
      break;
    }
    color = call.color;
  }
  return color;
}

// The balloons, closer together and rising faster as the shift goes on. Nearly half wear the
// colour being called as they set off, so that there is always something to pop.
export function standBalloons(seed: number, calls: readonly BalloonCall[] = balloonCalls(seed)) {
  const random = seededRandom(seed ^ 0x6a5);
  const balloons: Balloon[] = [];
  let at = 400;
  for (let index = 0; at < SHIFT_MS && index < MAX_BALLOONS; index++) {
    const rise = Math.max(2600, 4600 - index * 30) + Math.floor(random() * 400);
    const called = calledAt(calls, at + rise / 3);
    const color =
      random() < 0.45 ? called : BALLOON_COLORS[Math.floor(random() * BALLOON_COLORS.length)];
    balloons.push({ lane: Math.floor(random() * BALLOON_LANES), color, at, rise });
    at += Math.max(300, 800 - index * 7) + Math.floor(random() * 250);
  }
  return balloons;
}

export type BalloonsMoment = {
  kind: 'popped' | 'streak' | 'wrong';
  at: number;
  balloon: number;
};

export type BalloonsState = {
  now: number;
  // The balloons popped, by their index.
  popped: Set<number>;
  score: number;
  streak: number;
  mistakes: number;
  moments: BalloonsMoment[];
  endedAt: number | null;
};

function freshBalloons(): BalloonsState {
  return {
    now: 0,
    popped: new Set(),
    score: 0,
    streak: 0,
    mistakes: 0,
    moments: [],
    endedAt: null,
  };
}

export function balloonsPoints(state: Pick<BalloonsState, 'score'>): number {
  return state.score;
}

// Where a balloon is, from 0 as it sets off to 1 as it floats out, or null when not in the air.
export function riseOf(balloon: Balloon, now: number): number | null {
  const share = (now - balloon.at) / balloon.rise;
  return share >= 0 && share < 1 ? share : null;
}

// The highest balloon in a lane, the next to float away, the one a press pops, by its index.
export function highestIn(
  state: BalloonsState,
  balloons: readonly Balloon[],
  lane: number,
): number | null {
  let highest: number | null = null;
  let highestShare = -1;
  for (let index = 0; index < balloons.length && balloons[index].at <= state.now; index++) {
    const balloon = balloons[index];
    const share = riseOf(balloon, state.now);
    if (
      balloon.lane === lane &&
      share !== null &&
      !state.popped.has(index) &&
      share > highestShare
    ) {
      highest = index;
      highestShare = share;
    }
  }
  return highest;
}

// The balloon a press pops: the highest of a lane, or the one touched while it is in the air.
function targetOf(
  state: BalloonsState,
  balloons: readonly Balloon[],
  choice: number,
): number | null {
  if (!Number.isInteger(choice) || choice < 0) {
    return null;
  }
  if (choice < BALLOON_LANES) {
    return highestIn(state, balloons, choice);
  }
  const index = choice - BALLOON_LANES;
  const balloon = balloons[index];
  return balloon && riseOf(balloon, state.now) !== null && !state.popped.has(index) ? index : null;
}

// Whether a press would do something now, for the browser to send only those.
export function canPop(
  state: BalloonsState,
  balloons: readonly Balloon[],
  choice: number,
): boolean {
  return state.endedAt === null && targetOf(state, balloons, choice) !== null;
}

function pop(
  state: BalloonsState,
  balloons: readonly Balloon[],
  calls: readonly BalloonCall[],
  choice: number,
): boolean {
  const index = state.endedAt === null ? targetOf(state, balloons, choice) : null;
  if (index === null) {
    return false;
  }
  const at = state.now;
  state.popped.add(index);
  if (balloons[index].color !== calledAt(calls, at)) {
    state.mistakes += 1;
    state.streak = 0;
    state.moments.push({ kind: 'wrong', at, balloon: index });
    if (state.mistakes >= BALLOONS_MISTAKE_LIMIT) {
      state.endedAt = at;
    }
    return true;
  }
  state.score += 1;
  state.streak += 1;
  state.moments.push({ kind: 'popped', at, balloon: index });
  if (state.streak % BALLOON_STREAK === 0) {
    state.score += BALLOON_STREAK_BONUS;
    state.moments.push({ kind: 'streak', at, balloon: index });
  }
  return true;
}

export function simulateBalloons(
  seed: number,
  presses: readonly ShiftAction[],
  until: number,
  calls: readonly BalloonCall[] = balloonCalls(seed),
  balloons: readonly Balloon[] = standBalloons(seed, calls),
): BalloonsState | null {
  const state = freshBalloons();
  for (const [ms, choice] of presses) {
    state.now = ms;
    if (!pop(state, balloons, calls, choice)) {
      return null;
    }
  }
  state.now = state.endedAt === null ? Math.max(until, state.now) : state.endedAt;
  return state;
}
