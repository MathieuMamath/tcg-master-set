import { describe, expect, test } from 'vitest';
import {
  type CharacterState,
  followFocus,
  isMovementKey,
  joystickDirection,
  keyboardDirection,
  STILL,
  stepCharacter,
} from './movement';

const START: CharacterState = { x: 0, z: 0, heading: 0, isMoving: false };

describe('keyboardDirection', () => {
  test('maps arrows and physical WASD positions to the same directions', () => {
    expect(keyboardDirection(['ArrowUp'])).toEqual(keyboardDirection(['KeyW']));
    expect(keyboardDirection(['ArrowLeft'])).toEqual({ x: -1, z: 0 });
    expect(keyboardDirection(['KeyD'])).toEqual({ x: 1, z: 0 });
  });

  test('cancels opposite keys', () => {
    expect(keyboardDirection(['ArrowLeft', 'ArrowRight'])).toEqual({ x: 0, z: 0 });
  });

  test('does not add up two keys for the same direction', () => {
    expect(keyboardDirection(['ArrowUp', 'KeyW'])).toEqual({ x: 0, z: -1 });
  });

  test('keeps diagonals at full speed, not faster', () => {
    const { x, z } = keyboardDirection(['ArrowUp', 'ArrowRight']);
    expect(Math.hypot(x, z)).toBeCloseTo(1);
  });

  test('ignores other keys', () => {
    expect(isMovementKey('Space')).toBe(false);
    expect(keyboardDirection(['Space'])).toEqual({ x: 0, z: 0 });
  });
});

describe('joystickDirection', () => {
  test('scales with the distance from the centre', () => {
    expect(joystickDirection(20, 0, 40)).toEqual({ x: 0.5, z: 0 });
  });

  test('never exceeds full speed', () => {
    const { x, z } = joystickDirection(300, 400, 40);
    expect(Math.hypot(x, z)).toBeCloseTo(1);
  });
});

describe('stepCharacter', () => {
  test('stays in place without input', () => {
    expect(stepCharacter(START, STILL, 1)).toEqual(START);
  });

  test('stops moving when the input is released', () => {
    const walking = stepCharacter(START, { x: 1, z: 0 }, 0.5);
    const stopped = stepCharacter(walking, STILL, 0.5);

    expect(walking.isMoving).toBe(true);
    expect(stopped.isMoving).toBe(false);
    expect(stopped.x).toBe(walking.x);
  });

  test('moves in proportion to time', () => {
    const short = stepCharacter(START, { x: 1, z: 0 }, 0.5);
    const long = stepCharacter(START, { x: 1, z: 0 }, 1);

    expect(long.x).toBeCloseTo(short.x * 2);
    expect(long.z).toBe(0);
  });

  test('walks more slowly with a small joystick push', () => {
    const slow = stepCharacter(START, { x: 0.5, z: 0 }, 1);
    const fast = stepCharacter(START, { x: 1, z: 0 }, 1);

    expect(slow.x).toBeCloseTo(fast.x / 2);
  });

  test('ends up facing the walking direction', () => {
    const turned = stepCharacter(START, { x: 1, z: 0 }, 1);

    expect(turned.heading).toBeCloseTo(Math.PI / 2);
  });

  test('turns the short way round', () => {
    const nearlyBehind = { ...START, heading: Math.PI - 0.1 };
    const turned = stepCharacter(nearlyBehind, { x: -0.01, z: -1 }, 0.001);

    expect(turned.heading).toBeGreaterThan(nearlyBehind.heading);
  });
});

describe('followFocus', () => {
  test('holds still while the character stays within the radius', () => {
    const focus = { x: 0, z: 0 };

    expect(followFocus(focus, { x: 0.5, z: 0 }, 1)).toBe(focus);
  });

  test('moves just enough to keep the character at the radius', () => {
    const focus = followFocus({ x: 0, z: 0 }, { x: 3, z: 4 }, 1);

    expect(Math.hypot(3 - focus.x, 4 - focus.z)).toBeCloseTo(1);
  });
});
