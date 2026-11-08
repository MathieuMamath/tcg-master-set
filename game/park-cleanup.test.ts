import { describe, expect, test } from 'vitest';
import {
  BINS,
  CLEANUP_MISTAKE_LIMIT,
  canSort,
  cleanupPoints,
  inReach,
  type Litter,
  parkLitter,
  REACH_AFTER_MS,
  REACH_BEFORE_MS,
  STREAK,
  STREAK_BONUS,
  simulateCleanup,
} from './park-cleanup';
import { perfectCleanup } from './park-games.test-helpers';

const SEED = 20261108;

describe('the litter', () => {
  test('is the same for the same seed, and comes faster as the shift goes on', () => {
    const litter = parkLitter(SEED);
    expect(litter).toEqual(parkLitter(SEED));
    expect(litter.at(-1)?.travel).toBeLessThan(litter[0].travel);
  });

  test('never has two pieces within reach at once', () => {
    const litter = parkLitter(SEED);
    for (const [index, piece] of litter.entries()) {
      const next = litter[index + 1];
      if (next) {
        expect(next.at - REACH_BEFORE_MS).toBeGreaterThan(piece.at + REACH_AFTER_MS);
      }
    }
  });
});

describe('a shift', () => {
  const litter: Litter[] = [
    { bin: 'glass', look: 'jar', at: 2000, travel: 2000 },
    { bin: 'paper', look: 'newspaper', at: 3500, travel: 2000 },
  ];
  const glass = BINS.indexOf('glass');

  test('sorts the piece within reach into the bin pressed', () => {
    const state = simulateCleanup(SEED, [[1900, glass]], 2000, litter);
    expect(state && cleanupPoints(state)).toBe(1);
    expect(state?.next).toBe(1);
  });

  test('takes a press only while a piece is within reach', () => {
    const early = simulateCleanup(SEED, [], 1000, litter);
    if (!early) {
      throw new Error('no state');
    }
    expect(inReach(early, litter)).toBeNull();
    expect(canSort(early, litter)).toBe(false);
    expect(simulateCleanup(SEED, [[1000, glass]], 1100, litter)).toBeNull();
    expect(simulateCleanup(SEED, [[2000, 7]], 2100, litter)).toBeNull();
  });

  test('counts the wrong bin and a piece left behind as mistakes', () => {
    const wrong = simulateCleanup(SEED, [[2000, BINS.indexOf('paper')]], 2100, litter);
    expect(wrong?.mistakes).toBe(1);
    expect(wrong?.moments.at(-1)?.kind).toBe('wrongBin');
    const missed = simulateCleanup(SEED, [], 2000 + REACH_AFTER_MS, litter);
    expect(missed?.mistakes).toBe(1);
    expect(missed?.moments.at(-1)?.kind).toBe('missed');
  });

  test(`earns a bonus every ${STREAK} pieces sorted in a row`, () => {
    const state = simulateCleanup(SEED, perfectCleanup(SEED), 45_000);
    expect(state?.mistakes).toBe(0);
    expect(state?.bonus).toBe(Math.floor((state?.sorted ?? 0) / STREAK) * STREAK_BONUS);
  });

  test(`ends after ${CLEANUP_MISTAKE_LIMIT} mistakes`, () => {
    const state = simulateCleanup(SEED, [], 45_000);
    expect(state?.mistakes).toBe(CLEANUP_MISTAKE_LIMIT);
    expect(state?.endedAt).not.toBeNull();
  });
});
