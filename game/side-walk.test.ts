import { describe, expect, test } from 'vitest';
import { DASH_SPEED_FACTOR } from './dash';
import { sidePush, stepWalker, WALK_SPEED, type Walker } from './side-walk';

const BOUNDS = { minX: -10, maxX: 10 };
const STANDING: Walker = { x: 0, velocity: 0, facing: 1 };

function walk(push: number, seconds: number, from: Walker = STANDING) {
  let walker = from;
  for (let frame = 0; frame < seconds * 60; frame++) {
    walker = stepWalker(walker, push, false, 1 / 60, BOUNDS);
  }
  return walker;
}

describe('sidePush', () => {
  test('keeps only the sideways part of a push', () => {
    expect(sidePush({ x: 1, z: -1 })).toBe(1);
    expect(sidePush({ x: -0.5, z: 0 })).toBe(-0.5);
  });

  test('ignores a push straight up or down, or too small to mean anything', () => {
    expect(sidePush({ x: 0, z: -1 })).toBe(0);
    expect(sidePush({ x: 0.05, z: 0 })).toBe(0);
  });
});

describe('stepWalker', () => {
  test('speeds up softly to walking speed', () => {
    const first = stepWalker(STANDING, 1, false, 1 / 60, BOUNDS);

    expect(first.velocity).toBeGreaterThan(0);
    expect(first.velocity).toBeLessThan(WALK_SPEED);
    expect(walk(1, 1).velocity).toBeCloseTo(WALK_SPEED);
  });

  test('slows down to a stop once released', () => {
    expect(walk(0, 1, walk(1, 1)).velocity).toBeCloseTo(0);
  });

  test('faces the way it is pushed, and keeps facing it once stopped', () => {
    const left = walk(-1, 0.5);

    expect(left.facing).toBe(-1);
    expect(walk(0, 1, left).facing).toBe(-1);
  });

  test('never leaves the stage, and stops at its edge', () => {
    const atEdge = walk(1, 10);

    expect(atEdge.x).toBe(BOUNDS.maxX);
    expect(atEdge.velocity).toBe(0);
  });

  test('dashes at full speed the way it faces, even when not pushed', () => {
    const facingLeft: Walker = { x: 0, velocity: 0, facing: -1 };
    const dashed = stepWalker(facingLeft, 0, true, 0.1, BOUNDS);

    expect(dashed.velocity).toBe(-WALK_SPEED * DASH_SPEED_FACTOR);
    expect(dashed.x).toBeCloseTo(-WALK_SPEED * DASH_SPEED_FACTOR * 0.1);
  });
});
