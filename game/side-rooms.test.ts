import { describe, expect, test } from 'vitest';
import {
  ADMIN_PLACES,
  ARCADE,
  ARCADE_MACHINES,
  ARCADE_WALLS,
  BEDROOM,
  BEDROOM_FURNITURE,
  BEDROOM_WALLS,
  BOOKSHOP,
  BOOKSHOP_FURNITURE,
  BOOKSHOP_SELLER_X,
  BOOKSHOP_WALLS,
  BUREAU,
  COUPONS,
  DOWNTOWN,
  DOWNTOWN_BACK_TOWERS,
  DOWNTOWN_ENDS,
  DOWNTOWN_SPOTS,
  DOWNTOWN_TOWERS,
  exitAlong,
  FLAT,
  FLAT_FURNITURE,
  FLAT_WALLS,
  interactionAlong,
  isDoorInteraction,
  LEA_X,
  OFFICE_FLOORS,
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
  });

  test('Pip goes to bed in front of it, and nowhere else', () => {
    expect(interactionAlong(BEDROOM, BEDROOM_FURNITURE.bed.x)).toBe('bed');
    expect(interactionAlong(BEDROOM, BEDROOM.start)).toBeNull();
  });

  test('the door in the right wall leads out to the street', () => {
    expect(interactionAlong(BEDROOM, BEDROOM.bounds.maxX)).toBe('leaveHome');
    expect(exitAlong(BEDROOM, BEDROOM.bounds.maxX)?.to).toBe('town');
  });
});

describe('the street', () => {
  test('every building stands on it, without overlapping the next', () => {
    const { flats, house, shop, bookshop, arcade } = TOWN_BUILDINGS;

    expect(flats.x - flats.width / 2).toBeGreaterThan(TOWN_ENDS.left);
    expect(flats.x + flats.width / 2).toBeLessThan(house.x - house.width / 2);
    expect(bookshop.x + bookshop.width / 2).toBeLessThan(arcade.x - arcade.width / 2);
    expect(arcade.x + arcade.width / 2).toBeLessThan(TOWN_ENDS.right);
    expect(house.x + house.width / 2).toBeLessThan(shop.x - shop.width / 2);
    expect(shop.x + shop.width / 2).toBeLessThan(bookshop.x - bookshop.width / 2);
  });

  test("Bérénice's stand fits between the bookshop and the arcade, clear of their doors", () => {
    const { bookshop, arcade, raffle } = TOWN_BUILDINGS;

    expect(bookshop.x + bookshop.width / 2).toBeLessThan(raffle.x - raffle.width / 2);
    expect(raffle.x + raffle.width / 2).toBeLessThan(arcade.x - arcade.width / 2);
    expect(interactionAlong(TOWN, raffle.bereniceX)).toBe('berenice');
    expect(interactionAlong(TOWN, bookshop.doorX)).toBe('enterBookshop');
    expect(interactionAlong(TOWN, arcade.doorX)).toBe('enterArcade');
  });

  test("Gaspard's stand fits between our house and the shop, clear of their doors", () => {
    const { house, shop, dalgona } = TOWN_BUILDINGS;

    expect(house.x + house.width / 2).toBeLessThan(dalgona.x - dalgona.width / 2);
    expect(dalgona.x + dalgona.width / 2).toBeLessThan(shop.x - shop.width / 2);
    expect(interactionAlong(TOWN, dalgona.gaspardX)).toBe('gaspard');
    expect(speakerAlong(TOWN, dalgona.gaspardX)).toEqual({
      interaction: 'gaspard',
      x: dalgona.gaspardX,
    });
  });

  test('our house, the shop and the bookshop can all be entered', () => {
    expect(interactionAlong(TOWN, TOWN_BUILDINGS.house.doorX)).toBe('goHome');
    expect(interactionAlong(TOWN, TOWN_BUILDINGS.shop.doorX)).toBe('enterShop');
    expect(interactionAlong(TOWN, TOWN_BUILDINGS.bookshop.doorX)).toBe('enterBookshop');
    expect(interactionAlong(TOWN, TOWN_BUILDINGS.flats.doorX)).toBe('enterFlat');
    expect(interactionAlong(TOWN, TOWN_BUILDINGS.arcade.doorX)).toBe('enterArcade');
  });
});

describe('downtown', () => {
  test('its towers stand along the pavement, side by side, past the bus stop', () => {
    for (const row of [DOWNTOWN_TOWERS, DOWNTOWN_BACK_TOWERS]) {
      for (const [index, tower] of row.entries()) {
        expect(tower.x - tower.width / 2).toBeGreaterThan(DOWNTOWN_ENDS.left - 2);
        expect(tower.x + tower.width / 2).toBeLessThan(DOWNTOWN_ENDS.right + 2);
        const next = row[index + 1];
        if (next) {
          expect(tower.x + tower.width / 2).toBeLessThanOrEqual(next.x - next.width / 2 + 0.6);
        }
      }
    }
    const { busStop } = DOWNTOWN_SPOTS;
    expect(busStop.x + busStop.width / 2).toBeLessThan(
      DOWNTOWN_TOWERS[0].x - DOWNTOWN_TOWERS[0].width / 2,
    );
  });

  test("the administrative office's door stands clear of its neighbours and of the bus stop", () => {
    const { bureau, busStop } = DOWNTOWN_SPOTS;

    expect(interactionAlong(DOWNTOWN, bureau.doorX)).toBe('brutus');
    expect(speakerAlong(DOWNTOWN, bureau.doorX)?.x).toBe(bureau.brutusX);
    expect(DOWNTOWN.exits).toEqual([]);
    expect(busStop.x + busStop.width / 2).toBeLessThan(bureau.x - bureau.width / 2);
    for (const tower of DOWNTOWN_TOWERS) {
      expect(Math.abs(tower.x - bureau.x)).toBeGreaterThan((tower.width + bureau.width) / 2 - 0.6);
    }
  });

  test('rise out of sight', () => {
    for (const tower of DOWNTOWN_TOWERS) {
      expect(tower.height).toBeGreaterThan(10);
    }
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

describe("Léa's flat", () => {
  test('Léa can be talked to at her desk', () => {
    expect(interactionAlong(FLAT, LEA_X)).toBe('grandma');
    expect(speakerAlong(FLAT, LEA_X)).toEqual({ interaction: 'grandma', x: LEA_X });
  });

  test('its furniture fits between the walls without overlapping', () => {
    const pieces = Object.values(FLAT_FURNITURE).sort((a, b) => a.x - b.x);
    for (const [index, { x, width }] of pieces.entries()) {
      expect(x - width / 2).toBeGreaterThan(FLAT_WALLS.left);
      expect(x + width / 2).toBeLessThan(FLAT_WALLS.right);
      const next = pieces[index + 1];
      if (next) {
        expect(x + width / 2).toBeLessThan(next.x - next.width / 2);
      }
    }
  });

  test('arriving from the street, the player is at the door', () => {
    const arrival = TOWN.exits.find(({ to }) => to === 'flat')?.arrival;

    expect(arrival && interactionAlong(FLAT, arrival.x)).toBe('leaveFlat');
  });
});

describe('the arcade', () => {
  test('the basketball machine can be played in front of it', () => {
    expect(interactionAlong(ARCADE, ARCADE_MACHINES.basketball.x)).toBe('basketball');
    expect(interactionAlong(ARCADE, ARCADE_MACHINES.claw.x)).toBeNull();
  });

  test('its machines fit between the walls without overlapping', () => {
    const machines = Object.values(ARCADE_MACHINES).sort((a, b) => a.x - b.x);
    for (const [index, { x, width }] of machines.entries()) {
      expect(x - width / 2).toBeGreaterThan(ARCADE_WALLS.left);
      expect(x + width / 2).toBeLessThan(ARCADE_WALLS.right);
      const next = machines[index + 1];
      if (next) {
        expect(x + width / 2).toBeLessThan(next.x - next.width / 2);
      }
    }
  });

  test('arriving from the street, the player is at the door', () => {
    const arrival = TOWN.exits.find(({ to }) => to === 'arcade')?.arrival;

    expect(arrival && interactionAlong(ARCADE, arrival.x)).toBe('leaveArcade');
  });
});

describe('isDoorInteraction', () => {
  test('tells doors from other interactions', () => {
    expect(isDoorInteraction('enterShop')).toBe(true);
    expect(isDoorInteraction('latest')).toBe(false);
    expect(isDoorInteraction(null)).toBe(false);
  });
});

describe('the administrative office', () => {
  test('its lift serves the street and every floor, each one arrived at within its walls', () => {
    expect(OFFICE_FLOORS.map(({ place }) => place)).toEqual(['downtown', 'bureau', 'coupons']);
    for (const { place, arrival } of OFFICE_FLOORS) {
      expect(arrival.x).toBeGreaterThanOrEqual(SIDE_PLACES[place].bounds.minX);
      expect(arrival.x).toBeLessThanOrEqual(SIDE_PLACES[place].bounds.maxX);
    }
  });

  test('the lift is taken in the left wall of both floors, where their doors would be', () => {
    for (const room of [BUREAU, COUPONS]) {
      expect(interactionAlong(room, room.bounds.minX)).toBe('elevator');
      expect(room.exits).toEqual([]);
    }
  });

  test('both floors are for admins only', () => {
    expect(ADMIN_PLACES.has('bureau')).toBe(true);
    expect(ADMIN_PLACES.has('coupons')).toBe(true);
    expect(ADMIN_PLACES.has('downtown')).toBe(false);
  });
});
