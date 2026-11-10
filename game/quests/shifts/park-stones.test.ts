import { describe, expect, test } from 'vitest';
import { perfectStones } from './park-games.test-helpers';
import {
  BEST_STRENGTH,
  bestAngle,
  CHAMPION_BONUS,
  canThrow,
  MAX_SKIPS,
  PEBBLES,
  pebbleSetups,
  simulateStones,
  skipsOf,
} from './park-stones';

const SEED = 20261108;

describe('a pebble', () => {
  test('skips the most at the right angle and strength, and sinks far from them', () => {
    const [setup] = pebbleSetups(SEED);
    expect(skipsOf(setup, bestAngle(setup), BEST_STRENGTH)).toBe(MAX_SKIPS);
    expect(skipsOf(setup, bestAngle(setup) + 0.5, BEST_STRENGTH)).toBe(0);
    expect(skipsOf(setup, bestAngle(setup), 0.2)).toBe(0);
  });

  test("has its right angle moved by the lake's wind", () => {
    const [setup] = pebbleSetups(SEED);
    expect(bestAngle({ ...setup, wind: 1 })).toBeGreaterThan(bestAngle({ ...setup, wind: -1 }));
  });

  test('wants a low, flat throw, as on a real lake', () => {
    const [setup] = pebbleSetups(SEED);
    // From about 11 to 29 degrees, whatever the wind.
    for (const wind of [-1, 0, 1]) {
      const angle = bestAngle({ ...setup, wind }) * 90;
      expect(angle).toBeGreaterThan(10);
      expect(angle).toBeLessThan(30);
    }
    // Thrown up at 45 degrees, a pebble hardly skips, and past about 47 it sinks.
    const calm = { ...setup, wind: 0 };
    expect(skipsOf(calm, 0.5, BEST_STRENGTH)).toBeLessThanOrEqual(1);
    expect(skipsOf(calm, 0.53, BEST_STRENGTH)).toBe(0);
  });
});

describe('a shift', () => {
  test('throws only once a pebble is in hand, in two presses', () => {
    expect(simulateStones(SEED, [[100, 0]], 200)).toBeNull();
    const held = simulateStones(SEED, [[1000, 0]], 1100);
    expect(held?.heldAngle).not.toBeNull();
    expect(held && canThrow(held)).toBe(true);
    const thrown = simulateStones(
      SEED,
      [
        [1000, 0],
        [1500, 0],
      ],
      1600,
    );
    expect(thrown?.throws).toHaveLength(1);
    expect(thrown && canThrow(thrown)).toBe(false);
  });

  test('ends after the last pebble, a champion every time when perfect', () => {
    const state = simulateStones(SEED, perfectStones(SEED), 40_000);
    expect(state?.throws).toHaveLength(PEBBLES);
    expect(state?.endedAt).not.toBeNull();
    expect(state?.score).toBe(PEBBLES * (MAX_SKIPS + CHAMPION_BONUS));
  });
});
