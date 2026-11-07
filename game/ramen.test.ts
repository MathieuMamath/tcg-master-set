import { describe, expect, test } from 'vitest';
import {
  canFinishShift,
  isRamenJob,
  playShift,
  RAMEN_JOBS,
  SHIFT_RULES,
  type ShiftAction,
  shiftCoins,
  shiftSeed,
  shiftStars,
} from './ramen';
import { DISH_ACTIONS } from './ramen-dishes';
import { perfectDishes, perfectKitchen } from './ramen-games.test-helpers';
import { KITCHEN_INGREDIENTS } from './ramen-kitchen';
import { SERVICE_TABLES } from './ramen-service';
import { perfectService } from './ramen-service.test-helpers';

const SEED = 20261107;

describe('the jobs', () => {
  test('are known by their names only', () => {
    expect(RAMEN_JOBS.every(isRamenJob)).toBe(true);
    expect(isRamenJob('cleaning')).toBe(false);
  });

  test('have as many buttons as their choices', () => {
    expect(SHIFT_RULES.dishes.choices).toBe(DISH_ACTIONS.length);
    expect(SHIFT_RULES.kitchen.choices).toBe(KITCHEN_INGREDIENTS.length);
    expect(SHIFT_RULES.service.choices).toBe(SERVICE_TABLES);
  });

  test('pay nothing below the first step, then more for a better score', () => {
    for (const job of RAMEN_JOBS) {
      const [first, second] = SHIFT_RULES[job].pay;
      expect(shiftCoins(job, first.score - 1)).toBe(0);
      expect(shiftCoins(job, first.score)).toBe(first.coins);
      expect(shiftCoins(job, second.score)).toBe(second.coins);
      expect(second.coins).toBeGreaterThan(first.coins);
    }
  });

  test('earn a star for each step of pay, and a third well beyond', () => {
    for (const job of RAMEN_JOBS) {
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

describe('playShift', () => {
  test('a perfect shift pays the most, in every job', () => {
    const perfect = {
      dishes: perfectDishes(SEED),
      kitchen: perfectKitchen(SEED),
      service: perfectService(SEED, 60_000),
    };
    for (const job of RAMEN_JOBS) {
      const result = playShift(job, SEED, perfect[job]);
      expect(result?.mistakes, job).toBe(0);
      expect(shiftCoins(job, result?.score ?? 0), job).toBe(SHIFT_RULES[job].pay[1].coins);
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
