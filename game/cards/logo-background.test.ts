import { expect, test } from 'vitest';
import { clearEdgeBackground } from './logo-background';

const WHITE = [255, 255, 255, 255];
const BLACK = [0, 0, 0, 255];
const YELLOW = [255, 220, 40, 255];
const CLEAR = [0, 0, 0, 0];

function alphas(rows: number[][][]) {
  const width = rows[0].length;
  const pixels = new Uint8ClampedArray(rows.flat(2));
  clearEdgeBackground(pixels, width, rows.length);
  return rows.map((row, y) => row.map((_, x) => pixels[(y * width + x) * 4 + 3]));
}

test('clears a white background that reaches the edge', () => {
  expect(
    alphas([
      [WHITE, WHITE, WHITE],
      [WHITE, BLACK, WHITE],
      [WHITE, WHITE, WHITE],
    ]),
  ).toEqual([
    [0, 0, 0],
    [0, 255, 0],
    [0, 0, 0],
  ]);
});

test('keeps white enclosed by the logo', () => {
  expect(
    alphas([
      [BLACK, BLACK, BLACK],
      [BLACK, WHITE, BLACK],
      [BLACK, BLACK, BLACK],
    ]),
  ).toEqual([
    [255, 255, 255],
    [255, 255, 255],
    [255, 255, 255],
  ]);
});

test('keeps saturated colours on the edge', () => {
  expect(alphas([[YELLOW, WHITE]])).toEqual([[255, 0]]);
});

test('leaves a logo with a transparent background as it is', () => {
  expect(
    alphas([
      [CLEAR, BLACK],
      [CLEAR, WHITE],
    ]),
  ).toEqual([
    [0, 255],
    [0, 0],
  ]);
});
