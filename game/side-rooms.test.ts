import { describe, expect, test } from 'vitest';
import {
  BEDROOM,
  BEDROOM_FURNITURE,
  BEDROOM_WALLS,
  BOOKSHOP,
  BOOKSHOP_FURNITURE,
  BOOKSHOP_SELLER_X,
  BOOKSHOP_WALLS,
  exitAlong,
  interactionAlong,
  isDoorInteraction,
  SHOP,
  SHOP_COUNTER_WIDTH,
  SHOP_COUNTERS,
  SHOP_WALLS,
  SIDE_PLACES,
  speakerAlong,
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
  test('every building stands on it, without overlapping the next', () => {
    const { house, shop, bookshop } = TOWN_BUILDINGS;

    expect(house.x - house.width / 2).toBeGreaterThan(TOWN_ENDS.left);
    expect(bookshop.x + bookshop.width / 2).toBeLessThan(TOWN_ENDS.right);
    expect(house.x + house.width / 2).toBeLessThan(shop.x - shop.width / 2);
    expect(shop.x + shop.width / 2).toBeLessThan(bookshop.x - bookshop.width / 2);
  });

  test('our house, the shop and the bookshop can all be entered', () => {
    expect(interactionAlong(TOWN, TOWN_BUILDINGS.house.doorX)).toBe('goHome');
    expect(interactionAlong(TOWN, TOWN_BUILDINGS.shop.doorX)).toBe('enterShop');
    expect(interactionAlong(TOWN, TOWN_BUILDINGS.bookshop.doorX)).toBe('enterBookshop');
  });
});

describe('the shop', () => {
  test('each triplet can be talked to at her own counter', () => {
    for (const { stock, x } of SHOP_COUNTERS) {
      expect(interactionAlong(SHOP, x)).toBe(stock);
    }
  });

  test('the counters stand apart, between the walls', () => {
    for (const [index, { x }] of SHOP_COUNTERS.entries()) {
      expect(x - SHOP_COUNTER_WIDTH / 2).toBeGreaterThan(SHOP_WALLS.left);
      expect(x + SHOP_COUNTER_WIDTH / 2).toBeLessThan(SHOP_WALLS.right);
      const next = SHOP_COUNTERS[index + 1];
      if (next) {
        expect(x + SHOP_COUNTER_WIDTH / 2).toBeLessThan(next.x - SHOP_COUNTER_WIDTH / 2);
      }
    }
  });

  test('each seller stands at her counter, for the bubble over her head', () => {
    for (const { stock, x } of SHOP_COUNTERS) {
      expect(speakerAlong(SHOP, x)).toEqual({ interaction: stock, x });
    }
  });

  test('doors and furniture have no speaker', () => {
    expect(speakerAlong(SHOP, SHOP.bounds.minX)).toBeNull();
    expect(speakerAlong(BEDROOM, BEDROOM_FURNITURE.bookcase.x)).toBeNull();
  });

  test('the newest sets are always at the first counter', () => {
    expect(SHOP_COUNTERS[0].stock).toBe('latest');
  });

  test('arriving from the street, the player is at the door, not at a counter', () => {
    const arrival = TOWN.exits.find(({ to }) => to === 'shop')?.arrival;

    expect(arrival && interactionAlong(SHOP, arrival.x)).toBe('leaveShop');
  });
});

describe('the bookshop', () => {
  test('Mamie Noisette sells binders in front of her pile of books', () => {
    const { pile } = BOOKSHOP_FURNITURE;

    // Standing in front of its left end, so that the pile and the till show beside her.
    expect(Math.abs(BOOKSHOP_SELLER_X - pile.x)).toBeLessThan(pile.width);
    expect(interactionAlong(BOOKSHOP, BOOKSHOP_SELLER_X)).toBe('binderSeller');
    expect(speakerAlong(BOOKSHOP, BOOKSHOP_SELLER_X)).toEqual({
      interaction: 'binderSeller',
      x: BOOKSHOP_SELLER_X,
    });
  });

  test('its furniture fits between the walls without overlapping', () => {
    const pieces = Object.values(BOOKSHOP_FURNITURE).sort((a, b) => a.x - b.x);
    for (const [index, { x, width }] of pieces.entries()) {
      expect(x - width / 2).toBeGreaterThan(BOOKSHOP_WALLS.left);
      expect(x + width / 2).toBeLessThan(BOOKSHOP_WALLS.right);
      const next = pieces[index + 1];
      if (next) {
        expect(x + width / 2).toBeLessThan(next.x - next.width / 2);
      }
    }
  });

  test('arriving from the street, the player is at the door, not at the till', () => {
    const arrival = TOWN.exits.find(({ to }) => to === 'bookshop')?.arrival;

    expect(arrival && interactionAlong(BOOKSHOP, arrival.x)).toBe('leaveBookshop');
  });
});

describe('isDoorInteraction', () => {
  test('tells doors from other interactions', () => {
    expect(isDoorInteraction('enterShop')).toBe(true);
    expect(isDoorInteraction('latest')).toBe(false);
    expect(isDoorInteraction(null)).toBe(false);
  });
});
