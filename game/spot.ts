import { SIDE_PLACES, type SidePlaceId } from './side-rooms';
import type { Facing } from './side-walk';

// Where the character stands, saved so that a reload or a new visit resumes there: the place, how
// far along its floor, and which way it faces.
export type PlayerSpot = { place: SidePlaceId; x: number; facing: Facing };

// A spot comes from the browser or from an older save, when the places may have been different,
// so anything the character couldn't stand on counts as no spot at all. A spot gives no advantage,
// so how the player got there isn't checked.
export function parseSpot(value: unknown): PlayerSpot | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { place, x, facing } = value as Record<string, unknown>;
  if (typeof place !== 'string' || !Object.hasOwn(SIDE_PLACES, place)) {
    return null;
  }
  if (typeof x !== 'number' || !Number.isFinite(x) || (facing !== 1 && facing !== -1)) {
    return null;
  }
  const { bounds } = SIDE_PLACES[place as SidePlaceId];
  if (x < bounds.minX || x > bounds.maxX) {
    return null;
  }
  return { place: place as SidePlaceId, x, facing };
}
