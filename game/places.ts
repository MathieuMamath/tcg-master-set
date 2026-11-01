import { BEDROOM } from './bedroom';
import { isBlocked } from './collision';
import { SHOP } from './shop';
import { TOWN } from './town';
import { type Arrival, CHARACTER_RADIUS, obstaclesOf, type Place, type PlaceId } from './world';

export const PLACES: Record<PlaceId, Place> = { bedroom: BEDROOM, town: TOWN, shop: SHOP };

export type PlayerSpot = Arrival & { place: PlaceId };

// A spot comes from the browser or from an older save, when the map may have been different, so
// anywhere the character couldn't stand counts as no spot at all.
export function parseSpot(value: unknown): PlayerSpot | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { place: placeId, x, z, heading } = value as Record<string, unknown>;
  if (
    typeof placeId !== 'string' ||
    !Object.hasOwn(PLACES, placeId) ||
    !Number.isFinite(x) ||
    !Number.isFinite(z) ||
    !Number.isFinite(heading)
  ) {
    return null;
  }

  const spot = { place: placeId as PlaceId, x, z, heading } as PlayerSpot;
  const place = PLACES[spot.place];
  const isWithinBounds =
    spot.x >= place.bounds.minX + CHARACTER_RADIUS &&
    spot.x <= place.bounds.maxX - CHARACTER_RADIUS &&
    spot.z >= place.bounds.minZ + CHARACTER_RADIUS &&
    spot.z <= place.bounds.maxZ - CHARACTER_RADIUS;

  return isWithinBounds && !isBlocked(spot, obstaclesOf(place), CHARACTER_RADIUS) ? spot : null;
}
