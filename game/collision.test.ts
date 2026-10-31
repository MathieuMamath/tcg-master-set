import { describe, expect, test } from 'vitest';
import { isBlocked, moveWithCollisions, type Rect } from './collision';

const BOUNDS: Rect = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };
const BOX: Rect = { minX: 1, maxX: 2, minZ: -1, maxZ: 1 };
const RADIUS = 0.25;

describe('moveWithCollisions', () => {
  test('moves freely in open space', () => {
    expect(moveWithCollisions({ x: 0, z: 0 }, { x: -1, z: 1 }, [BOX], BOUNDS, RADIUS)).toEqual({
      x: -1,
      z: 1,
    });
  });

  test('stops at an obstacle', () => {
    const position = moveWithCollisions({ x: 0.7, z: 0 }, { x: 0.9, z: 0 }, [BOX], BOUNDS, RADIUS);

    expect(position).toEqual({ x: 0.7, z: 0 });
  });

  test('slides along an obstacle when walking diagonally', () => {
    const position = moveWithCollisions(
      { x: 0.7, z: 0 },
      { x: 0.9, z: 0.5 },
      [BOX],
      BOUNDS,
      RADIUS,
    );

    expect(position).toEqual({ x: 0.7, z: 0.5 });
  });

  test('stays inside the bounds, keeping the radius from the edge', () => {
    const position = moveWithCollisions({ x: 4, z: 4 }, { x: 9, z: 9 }, [], BOUNDS, RADIUS);

    expect(position).toEqual({ x: 4.75, z: 4.75 });
  });
});

describe('isBlocked', () => {
  test('accounts for the radius', () => {
    expect(isBlocked({ x: 0.8, z: 0 }, [BOX], RADIUS)).toBe(true);
    expect(isBlocked({ x: 0.7, z: 0 }, [BOX], RADIUS)).toBe(false);
  });
});
