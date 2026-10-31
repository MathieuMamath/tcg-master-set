import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { isBlocked } from './collision';
import { STILL } from './movement';
import {
  CHARACTER_START,
  footprintOf,
  ROOM_BOUNDS,
  ROOM_ITEMS,
  ROOM_OBSTACLES,
  stepInRoom,
} from './room';

const FRAME = 1 / 60;

describe('the room layout', () => {
  test('every item has a model file', () => {
    for (const { model } of ROOM_ITEMS) {
      expect(existsSync(join(process.cwd(), 'public/models/furniture', `${model}.glb`))).toBe(true);
    }
  });

  test('the character starts in free space', () => {
    expect(isBlocked(CHARACTER_START, ROOM_OBSTACLES, 0.25)).toBe(false);
  });

  test('every obstacle stands inside the room', () => {
    for (const obstacle of ROOM_OBSTACLES) {
      expect(obstacle.minX).toBeGreaterThanOrEqual(ROOM_BOUNDS.minX);
      expect(obstacle.maxX).toBeLessThanOrEqual(ROOM_BOUNDS.maxX);
      expect(obstacle.minZ).toBeGreaterThanOrEqual(ROOM_BOUNDS.minZ);
      expect(obstacle.maxZ).toBeLessThanOrEqual(ROOM_BOUNDS.maxZ);
    }
  });

  test('a quarter turn swaps the width and depth', () => {
    const straight = footprintOf({ model: 'desk', x: 0, z: 0 });
    const turned = footprintOf({ model: 'desk', x: 0, z: 0, quarterTurns: 1 });

    expect(turned.maxX).toBeCloseTo(straight.maxZ);
    expect(turned.maxZ).toBeCloseTo(straight.maxX);
  });
});

describe('walking in the room', () => {
  test.each([
    ['right', { x: 1, z: 0 }],
    ['left', { x: -1, z: 0 }],
    ['towards the camera', { x: 0, z: 1 }],
    ['towards the back wall', { x: 0, z: -1 }],
  ])('never leaves the room or enters furniture walking %s', (_, direction) => {
    let state = CHARACTER_START;
    for (let frame = 0; frame < 900; frame++) {
      state = stepInRoom(state, direction, FRAME);

      expect(isBlocked(state, ROOM_OBSTACLES, 0.25)).toBe(false);
      expect(Math.abs(state.x)).toBeLessThanOrEqual(ROOM_BOUNDS.maxX);
      expect(Math.abs(state.z)).toBeLessThanOrEqual(ROOM_BOUNDS.maxZ);
    }
  });

  test('the chair stops a walk towards the desk', () => {
    let state = { ...CHARACTER_START, x: -0.05, z: 0 };
    for (let frame = 0; frame < 360; frame++) {
      state = stepInRoom(state, { x: 0, z: -1 }, FRAME);
    }

    expect(state.z).toBeGreaterThan(-1.3);
    expect(state.isMoving).toBe(true);
  });

  test('standing still stays in place', () => {
    expect(stepInRoom(CHARACTER_START, STILL, FRAME)).toEqual(CHARACTER_START);
  });
});
