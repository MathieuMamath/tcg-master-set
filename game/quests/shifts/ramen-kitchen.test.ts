import { describe, expect, test } from 'vitest';
import {
  KITCHEN_INGREDIENTS,
  KITCHEN_MISTAKE_LIMIT,
  kitchenOrders,
  kitchenPoints,
  SLIDE_MS,
  simulateKitchen,
} from './ramen-kitchen';

const SEED = 99;
const orders = kitchenOrders(SEED);
const index = (name: string) => KITCHEN_INGREDIENTS.indexOf(name as 'noodles');

describe('the orders', () => {
  test('all have the noodles, and different toppings', () => {
    for (const { ingredients } of orders) {
      expect(ingredients).toContain('noodles');
      expect(ingredients.length).toBeGreaterThanOrEqual(2);
      expect(new Set(ingredients).size).toBe(ingredients.length);
    }
  });

  test('leave less time as the shift goes on', () => {
    expect(orders.at(-1)?.window).toBeLessThan(orders[0].window);
  });
});

describe('the belt', () => {
  test('serves a bowl filled in any order, with a bonus when quick', () => {
    const presses: [number, number][] = [...orders[0].ingredients]
      .reverse()
      .map((ingredient, step) => [SLIDE_MS + 100 + step * 150, index(ingredient)]);
    const state = simulateKitchen(SEED, presses, presses.at(-1)?.[0] ?? 0);
    expect(state?.served).toBe(1);
    expect(state?.quick).toBe(1);
    expect(state && kitchenPoints(state)).toBe(2);
    expect(state?.order).toBe(1);
  });

  test('a wrong ingredient spoils the bowl', () => {
    const wrong = KITCHEN_INGREDIENTS.find((item) => !orders[0].ingredients.includes(item));
    const state = simulateKitchen(
      SEED,
      [[SLIDE_MS + 100, index(wrong ?? 'noodles')]],
      SLIDE_MS + 100,
    );
    expect(state?.mistakes).toBe(1);
    expect(state?.order).toBe(1);
  });

  test('bowls left unfinished fall off, and end the shift', () => {
    const state = simulateKitchen(SEED, [], 45_000);
    expect(state?.mistakes).toBe(KITCHEN_MISTAKE_LIMIT);
    expect(state?.moments.every(({ kind }) => kind === 'dropped')).toBe(true);
  });

  test('refuses an ingredient while the bowl is still sliding in', () => {
    expect(simulateKitchen(SEED, [[0, 0]], 0)).toBeNull();
  });
});
