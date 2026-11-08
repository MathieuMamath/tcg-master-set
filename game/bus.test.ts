import { expect, test } from 'vitest';
import { BUS_STOPS, stopAt } from './bus';
import { interactionAlong, PARK, SIDE_PLACES, TOWN, TOWN_BUILDINGS, TOWN_ENDS } from './side-rooms';

test('the bus serves downtown, the main street and the park', () => {
  expect(BUS_STOPS.map(({ id }) => id)).toEqual(['downtown', 'mainStreet', 'park']);
});

test('each stop belongs to its place', () => {
  expect(stopAt('town')?.id).toBe('mainStreet');
  expect(stopAt('park')?.id).toBe('park');
  expect(stopAt('downtown')?.id).toBe('downtown');
  expect(stopAt('bedroom')).toBeUndefined();
});

test('getting off the bus lands inside the place, by its stop', () => {
  for (const { place, arrivalX } of BUS_STOPS) {
    const { bounds } = SIDE_PLACES[place];
    expect(arrivalX).toBeGreaterThanOrEqual(bounds.minX);
    expect(arrivalX).toBeLessThanOrEqual(bounds.maxX);
    expect(interactionAlong(SIDE_PLACES[place], arrivalX)).toBe('busStop');
  }
});

test('the sign of the stop can be read from the street, past the arcade', () => {
  const { arcade, busStop, bus } = TOWN_BUILDINGS;

  expect(interactionAlong(TOWN, busStop.signX)).toBe('busStop');
  expect(arcade.x + arcade.width / 2).toBeLessThan(busStop.x - busStop.width / 2);
  expect(busStop.x + busStop.width / 2).toBeLessThan(bus.x - bus.width / 2);
  expect(bus.x + bus.width / 2).toBeLessThan(TOWN_ENDS.right);
});

test('in the park, Pépin, Papy Caillou and Lucas can be talked to', () => {
  expect(PARK.interactions.map(({ interaction }) => interaction)).toEqual([
    'busStop',
    'gardener',
    'grandpa',
    'boy',
  ]);
});
