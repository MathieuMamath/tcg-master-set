import { describe, expect, test } from 'vitest';
import { ARCHERY_ACTIONS } from './dojo-archery';
import { perfectArchery, perfectSlicing } from './dojo-games.test-helpers';
import { SLICING_STROKES } from './dojo-slicing';
import { perfectCleanup, perfectStones } from './park-games.test-helpers';
import { DISH_ACTIONS } from './ramen-dishes';
import { perfectDishes, perfectKitchen } from './ramen-games.test-helpers';
import { KITCHEN_INGREDIENTS } from './ramen-kitchen';
import { SERVICE_TABLES } from './ramen-service';
import { perfectService } from './ramen-service.test-helpers';
import {
  canFinishShift,
  isShiftJob,
  playShift,
  SHIFT_JOBS,
  SHIFT_RULES,
  type ShiftAction,
  shiftCoins,
  shiftPayout,
  shiftSeed,
  shiftStars,
} from './shifts';
import { perfectBalloons, perfectMail } from './village-games.test-helpers';

const SEED = 20261107;

describe('the jobs', () => {
  test('are known by their names only', () => {
    expect(SHIFT_JOBS.every(isShiftJob)).toBe(true);
    expect(isShiftJob('cleaning')).toBe(false);
  });

  test('have as many buttons as their choices', () => {
    expect(SHIFT_RULES.dishes.choices).toBe(DISH_ACTIONS.length);
    expect(SHIFT_RULES.kitchen.choices).toBe(KITCHEN_INGREDIENTS.length);
    expect(SHIFT_RULES.service.choices).toBe(SERVICE_TABLES);
    expect(SHIFT_RULES.slicing.choices).toBe(SLICING_STROKES);
    expect(SHIFT_RULES.archery.choices).toBe(ARCHERY_ACTIONS.length);
  });

  test('pay nothing below the first step, then more for a better score', () => {
    for (const job of SHIFT_JOBS) {
      const [first, second] = SHIFT_RULES[job].pay;
      expect(shiftCoins(job, first.score - 1)).toBe(0);
      expect(shiftCoins(job, first.score)).toBe(first.coins);
      expect(shiftCoins(job, second.score)).toBe(second.coins);
      expect(second.coins).toBeGreaterThan(first.coins);
    }
  });

  test('earn a star for each step of pay, and a third well beyond', () => {
    for (const job of SHIFT_JOBS) {
      const [first, second] = SHIFT_RULES[job].pay;
      expect(shiftStars(job, first.score - 1)).toBe(0);
      expect(shiftStars(job, first.score)).toBe(1);
      expect(shiftStars(job, second.score)).toBe(2);
      expect(shiftStars(job, second.score * 2)).toBe(3);
    }
  });

  test('take their seed from the moment the shift began', () => {
    expect(shiftSeed(new Date(1_000))).toBe(1_000);
  });
});

describe('shiftPayout', () => {
  test('pays nothing below the first step', () => {
    expect(shiftPayout('kitchen', 0, null)).toMatchObject({ coins: 0, wasAlreadyPaid: false });
  });

  test("pays Yuzu's jobs the difference too", () => {
    const [one, , three] = SHIFT_RULES.kitchen.pay;
    expect(shiftPayout('kitchen', three.score, one.coins)).toEqual({
      coins: three.coins - one.coins,
      paidToday: three.coins,
      wasAlreadyPaid: false,
      hasEarnedAll: true,
    });
  });

  test('pays a lesson the difference each new star brings, up to the last', () => {
    const [one, two, three] = SHIFT_RULES.slicing.pay;
    const first = shiftPayout('slicing', one.score, null);
    expect(first).toMatchObject({ coins: one.coins, hasEarnedAll: false });
    const better = shiftPayout('slicing', two.score, first.paidToday);
    expect(better).toMatchObject({ coins: two.coins - one.coins, paidToday: two.coins });
    const same = shiftPayout('slicing', two.score, better.paidToday);
    expect(same).toMatchObject({ coins: 0, wasAlreadyPaid: true, hasEarnedAll: false });
    const best = shiftPayout('slicing', three.score, same.paidToday);
    expect(best).toMatchObject({ coins: three.coins - two.coins, hasEarnedAll: true });
    expect(shiftPayout('slicing', three.score + 50, best.paidToday)).toMatchObject({
      coins: 0,
      hasEarnedAll: true,
    });
  });

  test('pays a lesson its three stars at once from a first great shift', () => {
    const three = SHIFT_RULES.archery.pay[2];
    expect(shiftPayout('archery', three.score, null)).toMatchObject({
      coins: three.coins,
      hasEarnedAll: true,
    });
    expect(shiftStars('archery', three.score)).toBe(3);
    expect(shiftStars('archery', three.score - 1)).toBe(2);
  });
});

describe('playShift', () => {
  test('a perfect shift earns two stars at least, in every job', () => {
    const perfect = {
      dishes: perfectDishes(SEED),
      kitchen: perfectKitchen(SEED),
      service: perfectService(SEED, 60_000),
      slicing: perfectSlicing(SEED),
      archery: perfectArchery(SEED),
      cleanup: perfectCleanup(SEED),
      stones: perfectStones(SEED),
      balloons: perfectBalloons(SEED),
      mail: perfectMail(SEED),
    };
    for (const job of SHIFT_JOBS) {
      const result = playShift(job, SEED, perfect[job]);
      expect(result?.mistakes, job).toBe(0);
      expect(shiftStars(job, result?.score ?? 0), job).toBeGreaterThanOrEqual(2);
    }
  });

  test('refuses presses that a person could not make', () => {
    for (const actions of [
      'nope',
      [[0, 9]],
      [[-5, 0]],
      [[0.5, 0]],
      [[46_000, 0]],
      [
        [100, 0],
        [120, 0],
      ],
      [
        [500, 0],
        [100, 0],
      ],
      [[0, 0, 0]],
    ]) {
      expect(playShift('dishes', SEED, actions)).toBeNull();
    }
  });

  test('gives the same score from the same presses', () => {
    const presses: ShiftAction[] = perfectKitchen(SEED).slice(0, 20);
    expect(playShift('kitchen', SEED, presses)).toEqual(playShift('kitchen', SEED, presses));
  });
});

describe('canFinishShift', () => {
  const startedAt = new Date(0);
  const at = (seconds: number) => new Date(seconds * 1000);

  test('waits for the shift to have lasted as long as it played', () => {
    expect(canFinishShift(startedAt, at(20), 45_000, 'dishes')).toBe(false);
    expect(canFinishShift(startedAt, at(45), 45_000, 'dishes')).toBe(true);
  });

  test('lets a shift ended by mistakes finish early', () => {
    expect(canFinishShift(startedAt, at(12), 12_000, 'dishes')).toBe(true);
  });

  test('refuses a shift finished long after its time', () => {
    expect(canFinishShift(startedAt, at(90), 45_000, 'dishes')).toBe(false);
  });
});

test('a shift ends when its last pebble sinks, not when it is thrown', () => {
  // A perfect throw skips for nearly two seconds: finishing as it leaves would be too early.
  const presses = perfectStones(SEED);
  const result = playShift('stones', SEED, presses);
  const thrownAt = presses.at(-1)?.[0] ?? 0;
  const endedAtMs = result?.endedAtMs ?? 0;
  expect(endedAtMs - thrownAt).toBeGreaterThan(1000);
  expect(canFinishShift(new Date(0), new Date(thrownAt), endedAtMs, 'stones')).toBe(false);
  expect(canFinishShift(new Date(0), new Date(endedAtMs), endedAtMs, 'stones')).toBe(true);
});

test('a throw still in the air when the time is up ends with the shift', () => {
  const shiftMs = SHIFT_RULES.stones.seconds * 1000;
  // The first pebble, its angle held, thrown just before the time is up.
  const result = playShift('stones', SEED, [
    [1000, 0],
    [shiftMs - 50, 0],
  ]);
  expect(result?.endedAtMs).toBeLessThanOrEqual(shiftMs);
});
