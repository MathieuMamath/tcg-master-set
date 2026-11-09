import { describe, expect, test } from 'vitest';
import { isMovementKey, joystickDirection, keyboardDirection } from './movement';

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
