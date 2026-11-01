import { expect, test } from 'vitest';
import { horizontalStep, nextChoice, verticalStep } from './menu-keys';

test('the movement keys step through a menu', () => {
  expect(verticalStep('ArrowUp')).toBe(-1);
  expect(verticalStep('KeyS')).toBe(1);
  expect(horizontalStep('KeyA')).toBe(-1);
  expect(horizontalStep('ArrowRight')).toBe(1);
});

test('other keys do nothing', () => {
  expect(verticalStep('ArrowLeft')).toBeUndefined();
  expect(horizontalStep('ArrowUp')).toBeUndefined();
  expect(verticalStep('Space')).toBeUndefined();
});

test('moves one choice at a time', () => {
  expect(nextChoice(1, 1, 3)).toBe(2);
  expect(nextChoice(1, -1, 3)).toBe(0);
});

test('goes round at both ends', () => {
  expect(nextChoice(2, 1, 3)).toBe(0);
  expect(nextChoice(0, -1, 3)).toBe(2);
});

test('with nothing chosen, lands on the nearest end', () => {
  expect(nextChoice(-1, 1, 3)).toBe(0);
  expect(nextChoice(-1, -1, 3)).toBe(2);
});
