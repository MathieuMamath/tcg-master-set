import { describe, expect, test } from 'vitest';
import { canSearchKitten, isHidingSpot, kittenSpotFor } from './lost-kitten';
import { HIDING_SPOTS, hidingSpotAlong, SIDE_PLACES } from './side-rooms';

describe('the kitten', () => {
  test('hides in the same place all day, a different one for other days and players', () => {
    const spot = kittenSpotFor('player-1', '2026-11-09');
    expect(isHidingSpot(spot)).toBe(true);
    expect(kittenSpotFor('player-1', '2026-11-09')).toBe(spot);
    const days = Array.from({ length: 30 }, (_, day) =>
      kittenSpotFor('player-1', `2026-12-${String(day + 1).padStart(2, '0')}`),
    );
    expect(new Set(days).size).toBeGreaterThan(3);
    const players = Array.from({ length: 30 }, (_, player) =>
      kittenSpotFor(`player-${player}`, '2026-11-09'),
    );
    expect(new Set(players).size).toBeGreaterThan(3);
  });

  test('is only searched for a little after the hint, the same day', () => {
    const startedAt = new Date('2026-11-09T10:00:00Z');
    const later = (ms: number) => new Date(startedAt.getTime() + ms);
    expect(canSearchKitten(null, later(60_000))).toBe(false);
    expect(canSearchKitten(startedAt, later(1000))).toBe(false);
    expect(canSearchKitten(startedAt, later(60_000))).toBe(true);
    expect(canSearchKitten(startedAt, new Date('2026-11-10T09:00:00Z'))).toBe(false);
  });

  test('can be searched for at every hiding place, clear of doors and characters', () => {
    expect(isHidingSpot('nowhere')).toBe(false);
    for (const spot of HIDING_SPOTS) {
      expect(hidingSpotAlong(spot.place, spot.x)).toBe(spot.id);
      const room = SIDE_PLACES[spot.place];
      const along = room.interactions.filter(
        ({ minX, maxX }) => spot.x + 0.6 >= minX && spot.x - 0.6 <= maxX,
      );
      expect(along.map(({ interaction }) => interaction)).toEqual(['search']);
      expect(
        room.exits.some(({ minX, maxX }) => spot.x + 0.6 >= minX && spot.x - 0.6 <= maxX),
      ).toBe(false);
    }
  });
});
