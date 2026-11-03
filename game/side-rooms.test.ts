import { describe, expect, test } from 'vitest';
import { BEDROOM, BEDROOM_FURNITURE, BEDROOM_WALLS, interactionAlong } from './side-rooms';

describe('the bedroom', () => {
  test('starts the character inside the room, away from the bookcase', () => {
    expect(BEDROOM.start).toBeGreaterThan(BEDROOM.bounds.minX);
    expect(BEDROOM.start).toBeLessThan(BEDROOM.bounds.maxX);
    expect(interactionAlong(BEDROOM, BEDROOM.start)).toBeNull();
  });

  test('every piece of furniture fits between the walls', () => {
    for (const { x, width } of Object.values(BEDROOM_FURNITURE)) {
      expect(x - width / 2).toBeGreaterThanOrEqual(BEDROOM_WALLS.left - 0.01);
      expect(x + width / 2).toBeLessThanOrEqual(BEDROOM_WALLS.right);
    }
  });

  test('the binders can be opened in front of the bookcase, which the character can reach', () => {
    expect(interactionAlong(BEDROOM, BEDROOM_FURNITURE.bookcase.x)).toBe('binder');
    expect(interactionAlong(BEDROOM, BEDROOM_FURNITURE.bookcase.x + 0.8)).toBe('binder');
  });

  test('the bed stands against the left wall', () => {
    const { bed } = BEDROOM_FURNITURE;

    expect(bed.x - bed.width / 2).toBeCloseTo(BEDROOM_WALLS.left, 1);
  });

  test('nothing happens in front of the bed or the plant', () => {
    expect(interactionAlong(BEDROOM, BEDROOM_FURNITURE.bed.x)).toBeNull();
    expect(interactionAlong(BEDROOM, BEDROOM.bounds.maxX)).toBeNull();
  });
});
