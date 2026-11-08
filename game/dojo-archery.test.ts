import { describe, expect, test } from 'vitest';
import {
  ARROWS,
  arrowSetups,
  BULLSEYE_BONUS,
  canAim,
  RINGS,
  ringPoints,
  SWEEP,
  simulateArchery,
  sweepX,
  sweepY,
  windCarries,
} from './dojo-archery';
import { perfectArchery } from './dojo-games.test-helpers';

const SEED = 20261108;

describe('the arrows', () => {
  test('have their wind and sweeps from the seed, calm for the first ones', () => {
    const setups = arrowSetups(SEED);
    expect(setups).toHaveLength(ARROWS);
    expect(setups).toEqual(arrowSetups(SEED));
    expect(Math.abs(setups[0].wind)).toBeLessThanOrEqual(0.3);
    expect(setups.every(({ wind }) => Math.abs(wind) <= 1)).toBe(true);
  });

  test('sweep both lines across the whole target, faster arrow after arrow', () => {
    const setups = arrowSetups(SEED);
    const [setup] = setups;
    const xs = Array.from({ length: 300 }, (_, step) => sweepX(setup, 0, step * 10));
    const ys = Array.from({ length: 300 }, (_, step) => sweepY(setup, 0, step * 10));
    for (const line of [xs, ys]) {
      expect(Math.min(...line)).toBeCloseTo(-SWEEP, 1);
      expect(Math.max(...line)).toBeCloseTo(SWEEP, 1);
    }
    expect(setups.at(-1)?.periodX).toBeLessThan(setup.periodX + 200);
  });

  test('are carried sideways by the wind', () => {
    const setup = { ...arrowSetups(SEED)[0], wind: 1 };
    expect(windCarries(setup, 0)).toBeGreaterThan(0);
    expect(windCarries({ ...setup, wind: -1 }, 0)).toBeLessThan(0);
  });
});

describe('the rings', () => {
  test('score more the closer to the centre', () => {
    expect(ringPoints(0, 0)).toBe(RINGS[0].points);
    expect(ringPoints(0.35, 0)).toBe(6);
    expect(ringPoints(0, -0.8)).toBe(2);
    expect(ringPoints(0.9, 0)).toBe(0);
  });
});

describe('a shift', () => {
  test('aims only once an arrow is ready', () => {
    expect(simulateArchery(SEED, [[100, 0]], 200)).toBeNull();
    const held = simulateArchery(SEED, [[1000, 0]], 1100);
    expect(held?.heldX).not.toBeNull();
    expect(held?.shots).toHaveLength(0);
    expect(held && canAim(held)).toBe(true);
  });

  test('looses the arrow on the second press, where the two lines cross', () => {
    const setups = arrowSetups(SEED);
    const state = simulateArchery(
      SEED,
      [
        [1000, 0],
        [1600, 0],
      ],
      1700,
    );
    expect(state?.shots).toHaveLength(1);
    expect(state?.heldX).toBeNull();
    expect(state?.shots[0].x).toBeCloseTo(windCarries(setups[0], sweepX(setups[0], 800, 1000)));
    expect(state?.shots[0].y).toBeCloseTo(sweepY(setups[0], 1000, 1600));
    expect(state && canAim(state)).toBe(false);
  });

  test('ends once the tenth arrow lands, with a bonus for bullseyes in a row', () => {
    const state = simulateArchery(SEED, perfectArchery(SEED), 60_000);
    expect(state?.shots).toHaveLength(ARROWS);
    expect(state?.endedAt).not.toBeNull();
    expect(state?.bullseyes).toBe(ARROWS);
    expect(state?.score).toBe(ARROWS * RINGS[0].points + (ARROWS - 1) * BULLSEYE_BONUS);
  });
});
