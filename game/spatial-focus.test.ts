import { expect, test } from 'vitest';
import { type Box, nearestInDirection } from './spatial-focus';

// Two pages of two columns and two rows, side by side with a gap between them:
// 0 1   4 5
// 2 3   6 7
const cell = (column: number, row: number): Box => ({
  x: column * 10 + (column >= 2 ? 15 : 0),
  y: row * 14,
  width: 9,
  height: 13,
});
const BOXES = [
  cell(0, 0),
  cell(1, 0),
  cell(0, 1),
  cell(1, 1),
  cell(2, 0),
  cell(3, 0),
  cell(2, 1),
  cell(3, 1),
];

test('moves along a row and down a column', () => {
  expect(nearestInDirection(BOXES, 0, { x: 1, y: 0 })).toBe(1);
  expect(nearestInDirection(BOXES, 0, { x: 0, y: 1 })).toBe(2);
  expect(nearestInDirection(BOXES, 3, { x: -1, y: 0 })).toBe(2);
  expect(nearestInDirection(BOXES, 2, { x: 0, y: -1 })).toBe(0);
});

test('crosses to the page beside it on the same row', () => {
  expect(nearestInDirection(BOXES, 1, { x: 1, y: 0 })).toBe(4);
  expect(nearestInDirection(BOXES, 6, { x: -1, y: 0 })).toBe(3);
});

test('stays put with nothing that way', () => {
  expect(nearestInDirection(BOXES, 5, { x: 1, y: 0 })).toBeUndefined();
  expect(nearestInDirection(BOXES, 0, { x: 0, y: -1 })).toBeUndefined();
});

test('skips a gap left by an empty pocket', () => {
  const withGap = [cell(0, 0), cell(2, 0)];

  expect(nearestInDirection(withGap, 0, { x: 1, y: 0 })).toBe(1);
});
