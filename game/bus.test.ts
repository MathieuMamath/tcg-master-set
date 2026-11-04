import { expect, test } from 'vitest';
import { BUS_STOPS, isOpen, stopAt } from './bus';
import { interactionAlong, TOWN, TOWN_BUILDINGS, TOWN_ENDS } from './side-rooms';

test('the bus serves the main street and the park', () => {
  expect(BUS_STOPS.map(({ id }) => id)).toEqual(['mainStreet', 'park']);
});

test('the main street is the stop of the street', () => {
  expect(stopAt('town')?.id).toBe('mainStreet');
  expect(stopAt('bedroom')).toBeUndefined();
});

test('the park stop stays closed until the park is built', () => {
  const park = BUS_STOPS.find(({ id }) => id === 'park');

  expect(park && isOpen(park)).toBe(false);
});

test('the sign of the stop can be read from the street, past the arcade', () => {
  const { arcade, busStop, bus } = TOWN_BUILDINGS;

  expect(interactionAlong(TOWN, busStop.signX)).toBe('busStop');
  expect(arcade.x + arcade.width / 2).toBeLessThan(busStop.x - busStop.width / 2);
  expect(busStop.x + busStop.width / 2).toBeLessThan(bus.x - bus.width / 2);
  expect(bus.x + bus.width / 2).toBeLessThan(TOWN_ENDS.right);
});
