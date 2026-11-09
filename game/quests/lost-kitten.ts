// Mme Ronron's lost kitten: every day, her kitten Mistigri hides somewhere in the village, the park
// or downtown, and she gives the player a hint of where. The player walks there and searches the
// hiding places with the interact key. Finding him pays once a day.
//
// The day's hiding place is drawn on the server from the player and the date, so that it holds all
// day and differs between players. Each search is a request, and only the right one pays.

import { HIDING_SPOTS, type HidingSpotId } from '../world/side-rooms';
import { questDay } from './quests';

export const KITTEN_QUEST = 'lost-kitten';
export const KITTEN_REWARD = 200;
// Room to read the hint before the kitten can be found, so that no script finds him at once.
const MIN_SECONDS = 5;

export function isHidingSpot(value: unknown): value is HidingSpotId {
  return HIDING_SPOTS.some((spot) => spot.id === value);
}

// The day's hiding place for a player, the same all day: a hash of the player's id and the day.
export function kittenSpotFor(userId: string, day: string): HidingSpotId {
  let hash = 2166136261;
  for (const character of `${userId}:${day}`) {
    hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 16777619);
  }
  return HIDING_SPOTS[(hash >>> 0) % HIDING_SPOTS.length].id;
}

// The search came long enough after Mme Ronron gave her hint, and the same day: a hint from an
// earlier day pointed at that day's hiding place.
export function canSearchKitten(startedAt: Date | null, now: Date): boolean {
  return (
    startedAt !== null &&
    questDay(startedAt) === questDay(now) &&
    now.getTime() - startedAt.getTime() >= MIN_SECONDS * 1000
  );
}
