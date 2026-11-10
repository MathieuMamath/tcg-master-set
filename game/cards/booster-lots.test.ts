import { describe, expect, test } from 'vitest';
import { isBoosterLotSize, lotSizesFor } from './booster-lots';

describe('the lots of boosters', () => {
  test('are one, five or ten', () => {
    expect([1, 5, 10].every(isBoosterLotSize)).toBe(true);
    expect([0, 2, 11, '5', null].some(isBoosterLotSize)).toBe(false);
  });

  test('are only offered when the bag holds enough', () => {
    expect(lotSizesFor(0)).toEqual([]);
    expect(lotSizesFor(1)).toEqual([1]);
    expect(lotSizesFor(4)).toEqual([1]);
    expect(lotSizesFor(5)).toEqual([1, 5]);
    expect(lotSizesFor(9)).toEqual([1, 5]);
    expect(lotSizesFor(26)).toEqual([1, 5, 10]);
  });
});
