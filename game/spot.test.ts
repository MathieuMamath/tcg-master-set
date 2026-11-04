import { describe, expect, test } from 'vitest';
import { SIDE_PLACES } from './side-rooms';
import { parseSpot } from './spot';

describe('parseSpot', () => {
  test('keeps a spot on the floor of a place, facing either way', () => {
    expect(parseSpot({ place: 'shop', x: 0, facing: -1 })).toEqual({
      place: 'shop',
      x: 0,
      facing: -1,
    });
    const { bounds } = SIDE_PLACES.town;
    expect(parseSpot({ place: 'town', x: bounds.maxX, facing: 1 })?.x).toBe(bounds.maxX);
  });

  test('drops a spot past the ends of its place', () => {
    const { bounds } = SIDE_PLACES.bedroom;

    expect(parseSpot({ place: 'bedroom', x: bounds.maxX + 0.1, facing: 1 })).toBeNull();
    expect(parseSpot({ place: 'bedroom', x: bounds.minX - 0.1, facing: 1 })).toBeNull();
  });

  test('drops a place that no longer exists, such as one from the old town', () => {
    expect(parseSpot({ place: 'library', x: 0, facing: 1 })).toBeNull();
    expect(parseSpot({ place: 'toString', x: 0, facing: 1 })).toBeNull();
  });

  test('drops anything malformed', () => {
    for (const value of [
      null,
      'town',
      { place: 'town', x: Number.NaN, facing: 1 },
      { place: 'town', x: '0', facing: 1 },
      { place: 'town', x: 0, facing: 0 },
      { place: 'town', x: 0 },
    ]) {
      expect(parseSpot(value)).toBeNull();
    }
  });
});
