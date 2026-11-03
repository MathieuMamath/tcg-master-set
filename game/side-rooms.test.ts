import { describe, expect, test } from 'vitest';
import {
  BEDROOM,
  BEDROOM_FURNITURE,
  BEDROOM_WALLS,
  exitAlong,
  interactionAlong,
  SIDE_PLACES,
  TOWN,
  TOWN_BUILDINGS,
  TOWN_ENDS,
} from './side-rooms';

describe.each(Object.values(SIDE_PLACES))('the $id', (place) => {
  test('starts the character inside it', () => {
    expect(place.start).toBeGreaterThanOrEqual(place.bounds.minX);
    expect(place.start).toBeLessThanOrEqual(place.bounds.maxX);
  });

  test('every door can be reached, and leads inside the next place', () => {
    for (const exit of place.exits) {
      const reachable = Math.min(
        Math.max((exit.minX + exit.maxX) / 2, place.bounds.minX),
        place.bounds.maxX,
      );
      expect(exitAlong(place, reachable)).toBe(exit);

      const next = SIDE_PLACES[exit.to];
      expect(exit.arrival.x).toBeGreaterThanOrEqual(next.bounds.minX);
      expect(exit.arrival.x).toBeLessThanOrEqual(next.bounds.maxX);
    }
  });

  test('every door leads to a place with a door back', () => {
    for (const exit of place.exits) {
      expect(SIDE_PLACES[exit.to].exits.some(({ to }) => to === place.id)).toBe(true);
    }
  });
});

describe('the bedroom', () => {
  test('starts the character away from the bookcase and the door', () => {
    expect(interactionAlong(BEDROOM, BEDROOM.start)).toBeNull();
  });

  test('every piece of furniture fits between the walls', () => {
    for (const { x, width } of Object.values(BEDROOM_FURNITURE)) {
      expect(x - width / 2).toBeGreaterThanOrEqual(BEDROOM_WALLS.left - 0.01);
      expect(x + width / 2).toBeLessThanOrEqual(BEDROOM_WALLS.right);
    }
  });

  test('the bed stands against the left wall', () => {
    const { bed } = BEDROOM_FURNITURE;

    expect(bed.x - bed.width / 2).toBeCloseTo(BEDROOM_WALLS.left, 1);
  });

  test('the binders can be opened in front of the bookcase', () => {
    expect(interactionAlong(BEDROOM, BEDROOM_FURNITURE.bookcase.x)).toBe('binder');
    expect(interactionAlong(BEDROOM, BEDROOM_FURNITURE.bed.x)).toBeNull();
  });

  test('the door in the right wall leads out to the street', () => {
    expect(interactionAlong(BEDROOM, BEDROOM.bounds.maxX)).toBe('leaveHome');
    expect(exitAlong(BEDROOM, BEDROOM.bounds.maxX)?.to).toBe('town');
  });
});

describe('the street', () => {
  test('both buildings stand on it, without overlapping', () => {
    const { house, shop } = TOWN_BUILDINGS;

    expect(house.x - house.width / 2).toBeGreaterThan(TOWN_ENDS.left);
    expect(shop.x + shop.width / 2).toBeLessThan(TOWN_ENDS.right);
    expect(house.x + house.width / 2).toBeLessThan(shop.x - shop.width / 2);
  });

  test('our house can be entered, but the shop is closed', () => {
    expect(interactionAlong(TOWN, TOWN_BUILDINGS.house.doorX)).toBe('goHome');
    expect(interactionAlong(TOWN, TOWN_BUILDINGS.shop.doorX)).toBeNull();
  });
});
