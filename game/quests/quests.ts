import { FLAT_BOUNDS, FLAT_DOOR_REACH, FLAT_FURNITURE, LEA_X } from '../world/side-rooms';

// Léa's quest: dust off the walls of her flat while she works. The quest keeps its first id and
// giver from when it was a grandmother's, because players' progress is stored under them.
export const GRANDMA_QUEST = 'grandma-cleaning';
export const QUEST_REWARD = 100;
export const QUEST_SECONDS = 30;
export const STAIN_COUNT = 6;
// Each patch of dust takes a few rubs before it's gone.
export const SCRUBS_PER_STAIN = 3;

// Room for the request to reach the server, and a floor below which no one can have played.
const GRACE_SECONDS = 3;
const MIN_SECONDS = 3;

// How close along the floor the character must stand to rub a patch on the wall.
const STAIN_REACH = 0.55;
// Each patch can shift this far within its stretch of wall, for some variety from one day to the
// next while keeping them apart.
const JITTER = 0.12;
// The heights on the wall where dust can be: above the sofa, and above the shelf where it stands,
// so that no furniture hides a patch.
const LOWEST = 1.75;
const HIGHEST = 3.2;
const ABOVE_SHELF = 2.75;
// Léa's corner stays clear: she and her desk would hide the wall behind them.
const LEA_CLEARANCE = 1.45;

export type Stain = { id: number; x: number; height: number; scrubsLeft: number };

// The wall from past the door to Léa's corner is shared into one stretch per patch, and each
// patch settles near the middle of its own stretch.
export function stainSpots(): number[] {
  const start = FLAT_BOUNDS.minX + FLAT_DOOR_REACH + 0.4;
  const end = LEA_X - LEA_CLEARANCE;
  const stretch = (end - start) / STAIN_COUNT;
  return Array.from({ length: STAIN_COUNT }, (_, index) => start + stretch * (index + 0.5));
}

function isAboveShelf(x: number): boolean {
  const { shelf } = FLAT_FURNITURE;
  return Math.abs(x - shelf.x) < shelf.width / 2 + 0.4;
}

export function pickStains(random: () => number = Math.random): Stain[] {
  return stainSpots().map((spot, id) => {
    const x = spot + (random() * 2 - 1) * JITTER;
    const lowest = isAboveShelf(x) ? ABOVE_SHELF : LOWEST;
    return { id, x, height: lowest + random() * (HIGHEST - lowest), scrubsLeft: SCRUBS_PER_STAIN };
  });
}

// The patch the character stands below, if any: the nearest one within reach.
export function stainAlong(stains: readonly Stain[], x: number): Stain | null {
  let nearest: Stain | null = null;
  for (const stain of stains) {
    const distance = Math.abs(stain.x - x);
    if (distance <= STAIN_REACH && (!nearest || distance < Math.abs(nearest.x - x))) {
      nearest = stain;
    }
  }
  return nearest;
}

// One rub: the patch fades, and goes once it has had all its rubs.
export function scrubStain(stains: readonly Stain[], id: number): Stain[] {
  return stains
    .map((stain) => (stain.id === id ? { ...stain, scrubsLeft: stain.scrubsLeft - 1 } : stain))
    .filter(({ scrubsLeft }) => scrubsLeft > 0);
}

// The quest can be done once a day, so that it can't be repeated for endless coins.
export function questDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export type QuestAttempt = { startedAt: Date | null; completedOn: string | null };

export function canStartQuest({ completedOn }: QuestAttempt, now: Date): boolean {
  return completedOn !== questDay(now);
}

// The browser does the cleaning, so the server can only check that the time adds up.
export function canFinishQuest(attempt: QuestAttempt, now: Date): boolean {
  if (!attempt.startedAt || !canStartQuest(attempt, now)) {
    return false;
  }
  const seconds = (now.getTime() - attempt.startedAt.getTime()) / 1000;
  return seconds >= MIN_SECONDS && seconds <= QUEST_SECONDS + GRACE_SECONDS;
}

export function secondsLeft(startedAt: number, now: number): number {
  return Math.max(QUEST_SECONDS - (now - startedAt) / 1000, 0);
}
