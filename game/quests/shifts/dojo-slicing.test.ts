import { describe, expect, test } from 'vitest';
import { perfectSlicing } from './dojo-games.test-helpers';
import {
  canCut,
  flightOf,
  heightOf,
  inAir,
  LANE_DEPTH,
  laneStroke,
  SLICING_LANES,
  SLICING_MISTAKE_LIMIT,
  simulateSlicing,
  slicingPoints,
  slicingThrows,
  strokeOf,
  type Thrown,
  targetsOf,
} from './dojo-slicing';

const SEED = 20261108;

describe('the throws', () => {
  test('are the same for the same seed', () => {
    expect(slicingThrows(SEED)).toEqual(slicingThrows(SEED));
    expect(slicingThrows(SEED)).not.toEqual(slicingThrows(SEED + 1));
  });

  test('stay in their lanes, start with vegetables, and bring a pot now and then', () => {
    const throws = slicingThrows(SEED);
    expect(throws.every(({ lane }) => lane >= 0 && lane < SLICING_LANES)).toBe(true);
    expect(throws.slice(0, 6).some(({ kind }) => kind === 'pot')).toBe(false);
    expect(throws.some(({ kind }) => kind === 'pot')).toBe(true);
  });

  test('come quicker as the shift goes on', () => {
    const throws = slicingThrows(SEED);
    expect(throws.at(-1)?.air).toBeLessThan(throws[0].air);
  });

  test('rise to the top halfway through their flight, then fall back', () => {
    const [first] = slicingThrows(SEED);
    expect(flightOf(first, first.at - 1)).toBeNull();
    expect(flightOf(first, first.at + first.air / 2)).toBe(0.5);
    expect(flightOf(first, first.at + first.air)).toBeNull();
    expect(heightOf(0.5)).toBe(1);
    expect(heightOf(0)).toBe(0);
  });
});

describe('a stroke', () => {
  test('names its throws, never the others in their lanes', () => {
    // Two vegetables in the first lane, the second thrown a little after the first.
    const throws: Thrown[] = [
      { lane: 0, kind: 'carrot', at: 0, air: 2000 },
      { lane: 0, kind: 'radish', at: 300, air: 2000 },
      { lane: 2, kind: 'pepper', at: 0, air: 2000 },
    ];
    const state = simulateSlicing(SEED, [], 1000, throws);
    if (!state) {
      throw new Error('no state');
    }
    expect(targetsOf(state, throws, strokeOf(state, throws, [1]))).toEqual([1]);
    expect(targetsOf(state, throws, strokeOf(state, throws, [0, 2]))).toEqual([0, 2]);
    // A key cuts the one thrown first, which falls first.
    expect(targetsOf(state, throws, laneStroke(0))).toEqual([0]);

    const cut = simulateSlicing(SEED, [[1000, strokeOf(state, throws, [1])]], 1000, throws);
    expect(cut?.cut).toBe(1);
    expect(cut && inAir(cut, throws)).toEqual([0, 2]);
  });

  test('that names a throw not in the air is refused', () => {
    const throws = slicingThrows(SEED);
    const [first] = throws;
    const state = simulateSlicing(SEED, [], first.at + first.air / 2);
    expect(state && targetsOf(state, throws, laneStroke(first.lane) << 1)).toBeNull();
  });

  test('cuts only when something is in the air in its lanes', () => {
    const throws = slicingThrows(SEED);
    const [first] = throws;
    const before = simulateSlicing(SEED, [], first.at - 10);
    const during = simulateSlicing(SEED, [], first.at + first.air / 2);
    expect(before && canCut(before, throws, laneStroke(first.lane))).toBe(false);
    expect(during && canCut(during, throws, laneStroke(first.lane))).toBe(true);
    expect(during && canCut(during, throws, 0)).toBe(false);
  });

  test('scores a clean cut at the top of the flight, and a plain one lower down', () => {
    const [first] = slicingThrows(SEED);
    const top = Math.round(first.at + first.air / 2);
    const low = Math.round(first.at + first.air * 0.1);
    const clean = simulateSlicing(SEED, [[top, laneStroke(first.lane)]], top);
    const plain = simulateSlicing(SEED, [[low, laneStroke(first.lane)]], low);
    expect(clean && slicingPoints(clean)).toBe(2);
    expect(plain && slicingPoints(plain)).toBe(1);
  });

  test('that would cut nothing is refused, as only a script would send it', () => {
    expect(simulateSlicing(SEED, [[10, 1]], 100)).toBeNull();
  });
});

describe('mistakes', () => {
  test('a vegetable that lands uncut is lost, and three end the shift', () => {
    const state = simulateSlicing(SEED, [], 45_000);
    expect(state?.mistakes).toBe(SLICING_MISTAKE_LIMIT);
    expect(state?.endedAt).not.toBeNull();
    expect(state?.moments.every(({ kind }) => kind === 'dropped')).toBe(true);
  });

  test('cutting a pot breaks it', () => {
    const throws = slicingThrows(SEED);
    const potIndex = throws.findIndex(({ kind }) => kind === 'pot');
    const pot = throws[potIndex];
    const at = Math.round(pot.at + pot.air / 2);
    // Played from a perfect shift up to the pot, so that nothing else was lost before.
    const before = perfectSlicing(SEED, at - 100);
    const state = simulateSlicing(SEED, [...before, [at, laneStroke(pot.lane)]], at);
    expect(state?.ends.get(potIndex)?.kind).toBe('broken');
    expect(state?.moments.some(({ kind }) => kind === 'pot')).toBe(true);
  });
});

describe('a perfect shift', () => {
  test('cuts everything without a mistake, with combos', () => {
    const state = simulateSlicing(SEED, perfectSlicing(SEED), 45_000);
    expect(state?.mistakes).toBe(0);
    expect(state?.endedAt).toBeNull();
    expect(state?.clean).toBeGreaterThan(0);
    expect(state && inAir(state, slicingThrows(SEED)).length).toBeGreaterThanOrEqual(0);
  });
});

test('no more than two fly in a lane at once, and never a pot with a vegetable', () => {
  for (const seed of [SEED, 1, 2, 3, 4, 5]) {
    const throws = slicingThrows(seed);
    for (const pot of throws.filter(({ kind }) => kind === 'pot')) {
      const clash = throws.find(
        (other) =>
          other.kind !== 'pot' &&
          other.lane === pot.lane &&
          other.at < pot.at + pot.air &&
          pot.at < other.at + other.air,
      );
      expect(clash).toBeUndefined();
    }
    for (const thrown of throws) {
      const together = throws.filter(
        (other) =>
          other.lane === thrown.lane && other.at <= thrown.at && thrown.at < other.at + other.air,
      );
      expect(together.length).toBeLessThanOrEqual(LANE_DEPTH);
    }
  }
});
