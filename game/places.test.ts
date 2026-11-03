import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { APARTMENT, APARTMENT_FROM_TOWN } from './apartment';
import { ARCADE, ARCADE_FROM_TOWN, BASKETBALL_MACHINE } from './arcade';
import { BEDROOM, BEDROOM_FROM_TOWN, BEDROOM_START } from './bedroom';
import { isBlocked } from './collision';
import { LIBRARY, LIBRARY_FROM_TOWN } from './library';
import { type CharacterState, STILL } from './movement';
import { BOY_POSITION, LAKE, PARK, PARK_FROM_TOWN } from './park';
import { PLACES, parseSpot } from './places';
import { SHOP, SHOP_FROM_TOWN, SHOPKEEPER_POSITION } from './shop';
import { TOWN } from './town';
import {
  CHARACTER_RADIUS,
  dashInPlace,
  exitAt,
  footprintOf,
  interactionAt,
  isInside,
  MODEL_NAMES,
  NPC_MODELS,
  npcInReach,
  obstaclesOf,
  type Place,
  stepInPlace,
} from './world';

const FRAME = 1 / 60;
const ALL_PLACES = Object.values(PLACES);

function standingAt(position: { x: number; z: number; heading?: number }): CharacterState {
  return { heading: 0, ...position, isMoving: false };
}

function walk(
  place: Place,
  from: CharacterState,
  direction: { x: number; z: number },
  frames: number,
) {
  let state = from;
  for (let frame = 0; frame < frames; frame++) {
    state = stepInPlace(place, state, direction, FRAME);
  }
  return state;
}

function exitReachedWalking(
  place: Place,
  from: CharacterState,
  direction: { x: number; z: number },
) {
  let state = from;
  for (let frame = 0; frame < 900; frame++) {
    state = stepInPlace(place, state, direction, FRAME);
    const exit = exitAt(place, state);
    if (exit) {
      return exit;
    }
  }
  return undefined;
}

describe('every model', () => {
  test.each(MODEL_NAMES)('%s has a file', (model) => {
    expect(existsSync(join(process.cwd(), 'public/models', `${model}.glb`))).toBe(true);
  });
});

describe('every NPC model', () => {
  test.each(NPC_MODELS)('%s has a file', (model) => {
    expect(existsSync(join(process.cwd(), 'public/models/characters', `${model}.glb`))).toBe(true);
  });
});

describe.each(ALL_PLACES)('the $id layout', (place) => {
  test('every obstacle stands in the walkable area or behind it', () => {
    for (const obstacle of obstaclesOf(place)) {
      expect(obstacle.minX).toBeGreaterThanOrEqual(place.bounds.minX);
      expect(obstacle.maxX).toBeLessThanOrEqual(place.bounds.maxX);
      expect(obstacle.maxZ).toBeLessThanOrEqual(place.bounds.maxZ);
    }
  });

  test('every exit leads to a free spot outside the exits of its destination', () => {
    for (const { to, arrival } of place.exits) {
      const destination = PLACES[to];

      expect(isBlocked(arrival, obstaclesOf(destination), CHARACTER_RADIUS)).toBe(false);
      expect(isInside(arrival, destination.bounds)).toBe(true);
      expect(exitAt(destination, arrival)).toBeUndefined();
    }
  });

  test.each([
    ['right', { x: 1, z: 0 }],
    ['left', { x: -1, z: 0 }],
    ['towards the camera', { x: 0, z: 1 }],
    ['away from the camera', { x: 0, z: -1 }],
  ])('walking %s never leaves the area or enters an obstacle', (_, direction) => {
    const obstacles = obstaclesOf(place);
    let state = standingAt(place.cameraStart);

    for (let frame = 0; frame < 900; frame++) {
      state = stepInPlace(place, state, direction, FRAME);

      expect(isBlocked(state, obstacles, CHARACTER_RADIUS)).toBe(false);
      expect(isInside(state, place.bounds)).toBe(true);
    }
  });
});

describe('footprintOf', () => {
  test('a quarter turn swaps the width and depth', () => {
    const straight = footprintOf({ model: 'furniture/desk', x: 0, z: 0 });
    const turned = footprintOf({ model: 'furniture/desk', x: 0, z: 0, quarterTurns: 1 });

    expect(turned.maxX).toBeCloseTo(straight.maxZ);
    expect(turned.maxZ).toBeCloseTo(straight.maxX);
  });
});

describe('the bedroom', () => {
  test('the character starts in free space, away from the exit', () => {
    expect(isBlocked(BEDROOM_START, obstaclesOf(BEDROOM), CHARACTER_RADIUS)).toBe(false);
    expect(exitAt(BEDROOM, BEDROOM_START)).toBeUndefined();
  });

  test('the chair stops a walk towards the desk', () => {
    const state = walk(BEDROOM, standingAt({ x: -0.05, z: 0 }), { x: 0, z: -1 }, 360);

    expect(state.z).toBeGreaterThan(-1.3);
    expect(state.isMoving).toBe(true);
  });

  test('standing still stays in place', () => {
    const start = standingAt(BEDROOM_START);

    expect(stepInPlace(BEDROOM, start, STILL, FRAME)).toEqual(start);
  });

  test('the bookcases open the binder, from the floor in front of them', () => {
    const start = standingAt({ x: 1.3, z: 0 });

    expect(interactionAt(BEDROOM, start)).toBeNull();
    expect(interactionAt(BEDROOM, walk(BEDROOM, start, { x: 0, z: -1 }, 360))).toBe('binder');
  });

  test('walking through the door leads to the town', () => {
    const exit = exitReachedWalking(BEDROOM, standingAt(BEDROOM_FROM_TOWN), { x: -1, z: 0 });

    expect(exit?.to).toBe('town');
  });
});

describe('the town', () => {
  const arrival = BEDROOM.exits[0].arrival;

  test('walking up to the house door leads back to the bedroom', () => {
    const exit = exitReachedWalking(TOWN, standingAt(arrival), { x: 0, z: -1 });

    expect(exit?.to).toBe('bedroom');
  });

  test('the pavement leads straight from the house to the shop', () => {
    const state = walk(TOWN, standingAt(arrival), { x: 1, z: 0 }, 300);

    expect(state.x).toBeGreaterThan(3.5);
  });

  test('walking up to the shop door leads inside', () => {
    const exit = exitReachedWalking(TOWN, standingAt({ x: 2.9, z: 0 }), { x: 0, z: -1 });

    expect(exit?.to).toBe('shop');
  });

  test('the wall beside the shop door leads nowhere', () => {
    const state = walk(TOWN, standingAt({ x: 4.2, z: 0 }), { x: 0, z: -1 }, 300);

    expect(exitAt(TOWN, state)).toBeUndefined();
  });

  test('the road is walkable', () => {
    const state = walk(TOWN, standingAt(arrival), { x: 0, z: 1 }, 300);

    expect(state.z).toBeGreaterThan(2);
  });
});

describe('the shop', () => {
  test('walking through the door leads back to the town', () => {
    const exit = exitReachedWalking(SHOP, standingAt(SHOP_FROM_TOWN), { x: -1, z: 0 });

    expect(exit?.to).toBe('town');
  });

  test('the counter stops a walk towards the shopkeeper', () => {
    const start = standingAt({ x: SHOPKEEPER_POSITION.x, z: 0.2 });
    const state = walk(SHOP, start, { x: 0, z: -1 }, 360);

    expect(state.x).toBe(SHOPKEEPER_POSITION.x);
    expect(state.z).toBeGreaterThan(-1.4);
  });

  test('walking up to the counter brings the shopkeeper within reach', () => {
    const start = standingAt({ x: SHOPKEEPER_POSITION.x, z: 0.5 });

    expect(npcInReach(SHOP, start)).toBeUndefined();
    expect(npcInReach(SHOP, walk(SHOP, start, { x: 0, z: -1 }, 360))).toBeDefined();
  });

  test('nobody is within reach at the shop door', () => {
    expect(npcInReach(SHOP, SHOP_FROM_TOWN)).toBeUndefined();
  });

  test('each counter offers a conversation with its own shopkeeper', () => {
    expect(interactionAt(SHOP, { x: -2.4, z: -1 })).toBe('latest');
    expect(interactionAt(SHOP, { x: 0, z: -1 })).toBe('thisYear');
    expect(interactionAt(SHOP, { x: 2.4, z: -1 })).toBe('older');
  });

  test('the space between two counters offers nothing', () => {
    expect(interactionAt(SHOP, { x: 1.2, z: -1 })).toBeNull();
  });

  test('the shopkeeper blocks movement', () => {
    expect(isBlocked(SHOPKEEPER_POSITION, obstaclesOf(SHOP), 0)).toBe(true);
  });

  test('the shopkeeper stands behind the counter and within the room', () => {
    expect(SHOPKEEPER_POSITION.z).toBeLessThan(-1.7);
    expect(isInside(SHOPKEEPER_POSITION, SHOP.bounds)).toBe(true);
  });
});

describe('dashInPlace', () => {
  const LONG_FRAME = 0.1;

  test('goes further than walking in the same time', () => {
    const start = standingAt({ x: -1, z: 1.5 });
    const dashed = dashInPlace(SHOP, start, { x: 1, z: 0 }, FRAME);
    const walked = stepInPlace(SHOP, start, { x: 1, z: 0 }, FRAME);

    expect(dashed.x).toBeGreaterThan(walked.x);
  });

  test('never goes through a counter, even on a long frame', () => {
    let state = standingAt({ x: SHOPKEEPER_POSITION.x, z: -0.7 });
    for (let frame = 0; frame < 10; frame++) {
      state = dashInPlace(SHOP, state, { x: 0, z: -1 }, LONG_FRAME);
    }

    expect(state.z).toBeGreaterThan(-1.4);
  });

  test('never leaves the place', () => {
    let state = standingAt({ x: 0, z: 1.5 });
    for (let frame = 0; frame < 20; frame++) {
      state = dashInPlace(SHOP, state, { x: 0, z: 1 }, LONG_FRAME);
    }

    expect(isInside(state, SHOP.bounds)).toBe(true);
  });
});

describe('the apartment', () => {
  test('walking up to its door from the street leads inside', () => {
    const exit = exitReachedWalking(TOWN, standingAt({ x: -10, z: 0 }), { x: 0, z: -1 });

    expect(exit?.to).toBe('apartment');
  });

  test('walking through its door leads back to the town', () => {
    const exit = exitReachedWalking(APARTMENT, standingAt(APARTMENT_FROM_TOWN), { x: -1, z: 0 });

    expect(exit?.to).toBe('town');
  });

  test('walking up to the grandmother offers a conversation', () => {
    const start = standingAt({ x: 1.5, z: 1 });

    expect(interactionAt(APARTMENT, start)).toBeNull();
    expect(interactionAt(APARTMENT, walk(APARTMENT, start, { x: 0, z: -1 }, 360))).toBe('grandma');
  });

  test('the road reaches the far end of the town', () => {
    const state = walk(TOWN, standingAt({ x: -5, z: 2 }), { x: -1, z: 0 }, 900);

    expect(state.x).toBeLessThan(-13);
    expect(TOWN.items.some(({ model, x }) => model.includes('road-straight') && x === -12)).toBe(
      true,
    );
  });
});

describe('the library', () => {
  test('walking up to its door from the street leads inside', () => {
    const exit = exitReachedWalking(TOWN, standingAt({ x: 10, z: 0 }), { x: 0, z: -1 });

    expect(exit?.to).toBe('library');
  });

  test('the pavement leads from the shop to the library', () => {
    const state = walk(TOWN, standingAt({ x: 2.9, z: -0.35 }), { x: 1, z: 0 }, 600);

    expect(state.x).toBeGreaterThan(10);
  });

  test('walking through its door leads back to the town', () => {
    const exit = exitReachedWalking(LIBRARY, standingAt(LIBRARY_FROM_TOWN), { x: -1, z: 0 });

    expect(exit?.to).toBe('town');
  });

  test('walking up to the counter offers a conversation with the seller', () => {
    const start = standingAt({ x: 0, z: 1 });

    expect(interactionAt(LIBRARY, start)).toBeNull();
    expect(interactionAt(LIBRARY, walk(LIBRARY, start, { x: 0, z: -1 }, 360))).toBe('binderSeller');
  });

  test('nobody is within reach at its door', () => {
    expect(npcInReach(LIBRARY, LIBRARY_FROM_TOWN)).toBeUndefined();
  });
});

describe('the park', () => {
  test('the far end of the town road leads to the park', () => {
    const exit = exitReachedWalking(TOWN, standingAt({ x: 10, z: 2 }), { x: 1, z: 0 });

    expect(exit?.to).toBe('park');
  });

  test('its exit leads back to the end of the town road', () => {
    const exit = exitReachedWalking(PARK, standingAt(PARK_FROM_TOWN), { x: -1, z: 0 });

    expect(exit?.to).toBe('town');
  });

  test('the lake stops the character at its shore', () => {
    const state = walk(PARK, standingAt({ x: 0, z: 1 }), { x: 0, z: -1 }, 900);

    expect(state.z).toBeGreaterThanOrEqual(LAKE.maxZ + CHARACTER_RADIUS - 0.01);
  });

  test('the character can walk all the way round the lake', () => {
    const corners = [
      { x: LAKE.minX - 1, z: LAKE.maxZ + 1 },
      { x: LAKE.minX - 1, z: LAKE.minZ - 1 },
      { x: LAKE.maxX + 1, z: LAKE.minZ - 1 },
      { x: LAKE.maxX + 1, z: LAKE.maxZ + 1 },
    ];

    for (const corner of corners) {
      expect(isInside(corner, PARK.bounds)).toBe(true);
    }
    // Along each side of the lake, from one corner to the next.
    corners.forEach((corner, index) => {
      const next = corners[(index + 1) % corners.length];
      const steps = 40;
      for (let step = 0; step <= steps; step += 1) {
        const spot = {
          x: corner.x + ((next.x - corner.x) * step) / steps,
          z: corner.z + ((next.z - corner.z) * step) / steps,
        };
        expect(isBlocked(spot, obstaclesOf(PARK), CHARACTER_RADIUS)).toBe(false);
      }
    });
  });

  test('the grandfather can be reached without being in the way of the entrance', () => {
    expect(npcInReach(PARK, PARK_FROM_TOWN)).toBeUndefined();
    expect(interactionAt(PARK, { x: 3, z: 1 })).toBe('grandpa');
  });

  test('the little boy can be reached from the path round the lake', () => {
    expect(interactionAt(PARK, { x: BOY_POSITION.x, z: LAKE.maxZ + 1 })).toBe('boy');
  });
});

describe('the arcade', () => {
  test('its door in town leads inside', () => {
    const exit = exitReachedWalking(TOWN, standingAt({ x: -17.1, z: 0 }), { x: 0, z: -1 });

    expect(exit?.to).toBe('arcade');
  });

  test('its exit leads back to the town', () => {
    const exit = exitReachedWalking(ARCADE, standingAt(ARCADE_FROM_TOWN), { x: -1, z: 0 });

    expect(exit?.to).toBe('town');
  });

  test('the basketball machine can be played from in front of it', () => {
    const state = walk(ARCADE, standingAt({ x: BASKETBALL_MACHINE.x, z: 0 }), { x: 0, z: -1 }, 300);

    expect(interactionAt(ARCADE, state)).toBe('basketball');
    expect(interactionAt(ARCADE, ARCADE_FROM_TOWN)).toBeNull();
  });
});

describe('parseSpot', () => {
  const SPOT = { place: 'bedroom', ...BEDROOM_START };

  test('keeps a spot where the character can stand', () => {
    expect(parseSpot(SPOT)).toEqual(SPOT);
  });

  test('accepts every arrival of every place', () => {
    for (const place of ALL_PLACES) {
      for (const { to, arrival } of place.exits) {
        expect(parseSpot({ place: to, ...arrival })).not.toBeNull();
      }
    }
  });

  test('refuses anything that is not a spot', () => {
    expect(parseSpot(null)).toBeNull();
    expect(parseSpot(undefined)).toBeNull();
    expect(parseSpot('bedroom')).toBeNull();
    expect(parseSpot({ ...SPOT, x: '1' })).toBeNull();
    expect(parseSpot({ ...SPOT, heading: Number.NaN })).toBeNull();
  });

  test('refuses a place that does not exist', () => {
    expect(parseSpot({ ...SPOT, place: 'moon' })).toBeNull();
    expect(parseSpot({ ...SPOT, place: 'constructor' })).toBeNull();
  });

  test('refuses a spot outside the place', () => {
    expect(parseSpot({ ...SPOT, x: BEDROOM.bounds.maxX + 1 })).toBeNull();
    expect(parseSpot({ ...SPOT, z: BEDROOM.bounds.minZ - 1 })).toBeNull();
  });

  test('refuses a spot inside an obstacle', () => {
    const [obstacle] = obstaclesOf(BEDROOM);
    const center = {
      x: (obstacle.minX + obstacle.maxX) / 2,
      z: (obstacle.minZ + obstacle.maxZ) / 2,
    };

    expect(parseSpot({ ...SPOT, ...center })).toBeNull();
  });
});
