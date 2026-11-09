import { describe, expect, test } from 'vitest';
import {
  BALLOON_LANES,
  BALLOON_STREAK,
  BALLOON_STREAK_BONUS,
  BALLOONS_MISTAKE_LIMIT,
  type Balloon,
  type BalloonCall,
  balloonCalls,
  calledAt,
  canPop,
  highestIn,
  MAX_BALLOONS,
  simulateBalloons,
  standBalloons,
  touchOf,
} from './raffle-balloons';
import { perfectBalloons } from './village-games.test-helpers';

const SEED = 20261108;

describe('the calls', () => {
  test('change colour every time, from the seed', () => {
    const calls = balloonCalls(SEED);
    expect(calls).toEqual(balloonCalls(SEED));
    for (const [index, call] of calls.entries()) {
      if (index > 0) {
        expect(call.color).not.toBe(calls[index - 1].color);
      }
    }
    expect(calledAt(calls, calls[1].from)).toBe(calls[1].color);
  });
});

describe('the balloons', () => {
  test('rise in their lanes, from the seed', () => {
    const balloons = standBalloons(SEED);
    expect(balloons).toEqual(standBalloons(SEED));
    expect(balloons.every(({ lane }) => lane >= 0 && lane < BALLOON_LANES)).toBe(true);
  });
});

describe('a shift', () => {
  const calls: BalloonCall[] = [{ color: 'red', from: 0 }];
  const balloons: Balloon[] = [
    { lane: 0, color: 'red', at: 0, rise: 4000 },
    { lane: 0, color: 'blue', at: 800, rise: 4000 },
    { lane: 2, color: 'blue', at: 0, rise: 4000 },
  ];

  test('pops the highest balloon of a lane, scoring the colour called', () => {
    const state = simulateBalloons(SEED, [[1000, 0]], 1100, calls, balloons);
    expect(state?.score).toBe(1);
    expect(state?.popped.has(0)).toBe(true);
    expect(state && highestIn(state, balloons, 0)).toBe(1);
  });

  test('counts another colour as a mistake, and a press on an empty lane is refused', () => {
    const wrong = simulateBalloons(SEED, [[1000, 2]], 1100, calls, balloons);
    expect(wrong?.mistakes).toBe(1);
    const empty = simulateBalloons(SEED, [], 1000, calls, balloons);
    expect(empty && canPop(empty, balloons, 3)).toBe(false);
    expect(simulateBalloons(SEED, [[1000, 3]], 1100, calls, balloons)).toBeNull();
  });

  test('pops the very balloon touched, below the highest, but not one gone or popped', () => {
    const state = simulateBalloons(SEED, [[1000, touchOf(1)]], 1100, calls, balloons);
    expect(state?.mistakes).toBe(1);
    expect(state?.popped.has(1)).toBe(true);
    expect(state?.popped.has(0)).toBe(false);
    expect(simulateBalloons(SEED, [[500, touchOf(1)]], 600, calls, balloons)).toBeNull();
    expect(
      simulateBalloons(
        SEED,
        [
          [1000, touchOf(0)],
          [1200, touchOf(0)],
        ],
        1300,
        calls,
        balloons,
      ),
    ).toBeNull();
    expect(simulateBalloons(SEED, [[5000, touchOf(0)]], 5100, calls, balloons)).toBeNull();
    expect(simulateBalloons(SEED, [[1000, touchOf(9)]], 1100, calls, balloons)).toBeNull();
  });

  test(`sends up fewer than ${MAX_BALLOONS} balloons, so that a touch stays within the shift's choices`, () => {
    expect(standBalloons(SEED).length).toBeLessThan(MAX_BALLOONS);
  });

  test(`earns a bonus every ${BALLOON_STREAK} in a row, and ends after ${BALLOONS_MISTAKE_LIMIT} mistakes`, () => {
    const state = simulateBalloons(SEED, perfectBalloons(SEED), 45_000);
    expect(state?.mistakes).toBe(0);
    const popped = state?.moments.filter(({ kind }) => kind === 'popped').length ?? 0;
    expect(state?.score).toBe(popped + Math.floor(popped / BALLOON_STREAK) * BALLOON_STREAK_BONUS);
  });
});
