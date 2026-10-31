import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { BEDROOM, BEDROOM_FROM_TOWN, BEDROOM_START } from './bedroom';
import { isBlocked } from './collision';
import { type CharacterState, STILL } from './movement';
import { PLACES } from './places';
import { TOWN } from './town';
import {
  CHARACTER_RADIUS,
  exitAt,
  footprintOf,
  isInside,
  MODEL_NAMES,
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

  test('the shop has no exit yet', () => {
    const inFrontOfShop = standingAt({ x: 3.5, z: 0 });
    const state = walk(TOWN, inFrontOfShop, { x: 0, z: -1 }, 300);

    expect(state.x).toBe(3.5);
    expect(exitAt(TOWN, state)).toBeUndefined();
  });

  test('the road is walkable', () => {
    const state = walk(TOWN, standingAt(arrival), { x: 0, z: 1 }, 300);

    expect(state.z).toBeGreaterThan(2);
  });
});
