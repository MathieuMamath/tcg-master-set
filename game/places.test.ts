import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { BEDROOM, BEDROOM_FROM_TOWN, BEDROOM_START } from './bedroom';
import { isBlocked } from './collision';
import { type CharacterState, STILL } from './movement';
import { PLACES } from './places';
import { SHOP, SHOP_FROM_TOWN, SHOPKEEPER_POSITION } from './shop';
import { TOWN } from './town';
import {
  CHARACTER_RADIUS,
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
    expect(state.z).toBeGreaterThan(-0.8);
  });

  test('walking up to the counter brings the shopkeeper within reach', () => {
    const start = standingAt({ x: SHOPKEEPER_POSITION.x, z: 0.5 });

    expect(npcInReach(SHOP, start)).toBeUndefined();
    expect(npcInReach(SHOP, walk(SHOP, start, { x: 0, z: -1 }, 360))).toBeDefined();
  });

  test('nobody is within reach at the shop door', () => {
    expect(npcInReach(SHOP, SHOP_FROM_TOWN)).toBeUndefined();
  });

  test('the counter offers a conversation rather than the binder', () => {
    expect(interactionAt(SHOP, { x: 0.2, z: -0.5 })).toBe('talk');
  });

  test('the shopkeeper blocks movement', () => {
    expect(isBlocked(SHOPKEEPER_POSITION, obstaclesOf(SHOP), 0)).toBe(true);
  });

  test('the shopkeeper stands behind the counter and within the room', () => {
    expect(SHOPKEEPER_POSITION.z).toBeLessThan(-1.05);
    expect(isInside(SHOPKEEPER_POSITION, SHOP.bounds)).toBe(true);
  });
});
