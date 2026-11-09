import { expect, test } from 'vitest';
import { gridStep, horizontalStep, nextChoice, pageStep, verticalStep } from './menu-keys';

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

test('walks through a grid by items and by rows', () => {
  // Three columns, seven items: 0 1 2 / 3 4 5 / 6.
  expect(gridStep(1, 'ArrowRight', 3, 7)).toBe(2);
  expect(gridStep(2, 'ArrowRight', 3, 7)).toBe(3);
  expect(gridStep(1, 'ArrowDown', 3, 7)).toBe(4);
  expect(gridStep(4, 'KeyW', 3, 7)).toBe(1);
});

test('stops at the edges of a grid', () => {
  expect(gridStep(0, 'ArrowLeft', 3, 7)).toBe(0);
  expect(gridStep(1, 'ArrowUp', 3, 7)).toBe(1);
  expect(gridStep(5, 'ArrowDown', 3, 7)).toBe(5);
  expect(gridStep(6, 'ArrowRight', 3, 7)).toBe(6);
});

test('starts a grid at its first item, and ignores other keys', () => {
  expect(gridStep(-1, 'ArrowDown', 3, 7)).toBe(0);
  expect(gridStep(2, 'Enter', 3, 7)).toBeUndefined();
});

test('the page keys turn a whole page', () => {
  expect(pageStep('PageUp')).toBe(-1);
  expect(pageStep('PageDown')).toBe(1);
  expect(pageStep('ArrowRight')).toBeUndefined();
});
