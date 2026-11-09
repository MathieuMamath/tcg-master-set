import { expect, test } from 'vitest';
import { countAt, countDuration } from './count-animation';

test('starts on the old number and ends on the new one', () => {
  expect(countAt(100, 136, 0)).toBe(100);
  expect(countAt(100, 136, 1)).toBe(136);
  expect(countAt(136, 36, 1)).toBe(36);
});

test('stays between the two numbers, whatever the progress', () => {
  expect(countAt(100, 136, -1)).toBe(100);
  expect(countAt(100, 136, 2)).toBe(136);
});

test('moves faster at first', () => {
  const firstHalf = countAt(0, 1000, 0.5);

  expect(firstHalf).toBeGreaterThan(500);
  expect(firstHalf).toBeLessThan(1000);
});

test('counts whole numbers in both directions', () => {
  for (const progress of [0.1, 0.3, 0.7]) {
    expect(Number.isInteger(countAt(0, 7, progress))).toBe(true);
    expect(Number.isInteger(countAt(7, 0, progress))).toBe(true);
  }
});

test('a bigger change rolls for longer, within limits', () => {
  expect(countDuration(10, 11)).toBe(350);
  expect(countDuration(100, 0)).toBeGreaterThan(countDuration(11, 10));
  expect(countDuration(0, 10_000_000)).toBe(1200);
});
