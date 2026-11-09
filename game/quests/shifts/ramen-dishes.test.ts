import { describe, expect, test } from 'vitest';
import {
  CARRY_MS,
  canDo,
  DISHES_MISTAKE_LIMIT,
  dirtyBowls,
  dishesPoints,
  pileBonus,
  simulateDishes,
  TUB_LIMIT,
  toppleChance,
} from './ramen-dishes';

const SEED = 77;
const bowls = dirtyBowls(SEED);
// The presses that wash the first bowl clean and stack it, from a moment.
function washFirst(from: number): [number, number][] {
  const presses: [number, number][] = [];
  let ms = from;
  for (let stain = 0; stain < bowls[0].stains; stain++) {
    presses.push([ms, 0]);
    ms += 200;
  }
  presses.push([ms, 1], [ms + 200, 2]);
  return presses;
}

describe('the bowls', () => {
  test('wait in the tub from the start, then come faster and faster', () => {
    expect(bowls[2].arrivesAt).toBe(0);
    const gaps = bowls.slice(4).map((bowl, index) => bowl.arrivesAt - bowls[index + 3].arrivesAt);
    expect(Math.max(...gaps.slice(-10))).toBeLessThan(Math.min(...gaps.slice(0, 3)));
  });
});

describe('the pile', () => {
  test('is steady while low, then ever more likely to topple', () => {
    expect(toppleChance(3)).toBe(0);
    expect(toppleChance(5)).toBe(0);
    expect(toppleChance(8)).toBeGreaterThan(toppleChance(6));
  });

  test('earns a bigger bonus the taller it is when carried', () => {
    expect(pileBonus(2)).toBe(0);
    expect(pileBonus(9)).toBeGreaterThan(pileBonus(7));
    expect(pileBonus(7)).toBeGreaterThan(pileBonus(5));
  });
});

describe('washing up', () => {
  test('a bowl scrubbed, rinsed and stacked goes on the pile, and scores once carried', () => {
    const presses = washFirst(100);
    const stacked = simulateDishes(SEED, presses, presses.at(-1)?.[0] ?? 0);
    expect(stacked?.pile).toBe(1);
    expect(stacked && dishesPoints(stacked)).toBe(0);

    const at = (presses.at(-1)?.[0] ?? 0) + 200;
    const carried = simulateDishes(SEED, [...presses, [at, 3]], at);
    expect(carried?.banked).toBe(1);
    expect(carried && canDo(carried, 'scrub')).toBe(false);
    expect(simulateDishes(SEED, [...presses, [at, 3]], at + CARRY_MS)?.carryingUntil).toBeNull();
  });

  test('rinsing a stained bowl, or stacking an unrinsed one, breaks it', () => {
    expect(simulateDishes(SEED, [[100, 1]], 100)?.mistakes).toBe(1);
    expect(simulateDishes(SEED, [[100, 2]], 100)?.mistakes).toBe(1);
  });

  test('an overflowing tub breaks bowls, and ends the shift', () => {
    const state = simulateDishes(SEED, [], 45_000);
    expect(state?.mistakes).toBe(DISHES_MISTAKE_LIMIT);
    expect(state?.tub.length).toBe(TUB_LIMIT + 1);
    expect(state?.moments.every(({ kind }) => kind === 'overflow')).toBe(true);
  });

  test('refuses carrying an empty pile', () => {
    expect(simulateDishes(SEED, [[100, 3]], 100)).toBeNull();
  });
});
