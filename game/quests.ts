import { APARTMENT, APARTMENT_FROM_TOWN } from './apartment';
import { isBlocked, type Position } from './collision';
import { CHARACTER_RADIUS, exitAt, npcInReach, obstaclesOf } from './world';

export const GRANDMA_QUEST = 'grandma-cleaning';
export const QUEST_REWARD = 100;
export const QUEST_SECONDS = 30;
export const STAIN_COUNT = 8;

// Room for the request to reach the server, and a floor below which no one can have played.
const GRACE_SECONDS = 3;
const MIN_SECONDS = 3;

const STAIN_REACH = 0.45;
const GRID_STEP = 0.5;
const STAIN_MARGIN = 0.1;

export type Stain = Position & { id: number };

// Every spot of the floor a stain can be on: the character must be able to reach it, and it mustn't
// be where the player starts or talks.
export function stainSpots(): Position[] {
  const { minX, maxX, minZ, maxZ } = APARTMENT.bounds;
  const obstacles = obstaclesOf(APARTMENT);
  const spots: Position[] = [];
  for (let x = minX + GRID_STEP; x < maxX; x += GRID_STEP) {
    for (let z = minZ + GRID_STEP; z < maxZ; z += GRID_STEP) {
      const spot = { x, z };
      const isNearArrival =
        Math.hypot(x - APARTMENT_FROM_TOWN.x, z - APARTMENT_FROM_TOWN.z) < GRID_STEP * 2;
      if (
        !isBlocked(spot, obstacles, CHARACTER_RADIUS + STAIN_MARGIN) &&
        !exitAt(APARTMENT, spot) &&
        !npcInReach(APARTMENT, spot) &&
        !isNearArrival
      ) {
        spots.push(spot);
      }
    }
  }
  return spots;
}

export function pickStains(random: () => number = Math.random): Stain[] {
  const spots = stainSpots();
  const picked: Stain[] = [];
  for (let id = 0; id < STAIN_COUNT && spots.length > 0; id += 1) {
    const [spot] = spots.splice(Math.floor(random() * spots.length), 1);
    picked.push({ ...spot, id });
  }
  return picked;
}

export function stainsReached(stains: readonly Stain[], position: Position): Stain[] {
  return stains.filter(
    (stain) => Math.hypot(stain.x - position.x, stain.z - position.z) <= STAIN_REACH,
  );
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
