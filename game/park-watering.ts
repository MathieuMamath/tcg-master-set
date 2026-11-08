// Watering Pépin's flower beds at Linden Park: a gentle chore, once a day, for a fixed reward. Five
// beds are thirsty, and each blooms after a few pourings from the can. There is no clock and no
// mistake to make: once every bed is in flower, Pépin pays.
//
// The watering happens in the browser, so, as for Léa's dusting, the server records when it
// started and only pays if the time adds up.

export const WATERING_QUEST = 'park-watering';
export const WATERING_REWARD = 150;
export const BEDS = 5;
export const POURS_PER_BED = 3;

// Room for the request to reach the server, a floor below which no one can have watered every bed,
// and a ceiling past which the attempt is stale.
const MIN_SECONDS = 3;
const MAX_SECONDS = 180;

// Each bed's pourings so far, from 0, thirsty, to `POURS_PER_BED`, in flower.
export type Beds = readonly number[];

export function thirstyBeds(): Beds {
  return Array.from({ length: BEDS }, () => 0);
}

export function bloomingBeds(): Beds {
  return Array.from({ length: BEDS }, () => POURS_PER_BED);
}

// One pouring on a bed, which does nothing once it is in flower.
export function pour(beds: Beds, bed: number): Beds {
  return beds.map((pourings, index) =>
    index === bed ? Math.min(POURS_PER_BED, pourings + 1) : pourings,
  );
}

export function isBlooming(pourings: number): boolean {
  return pourings >= POURS_PER_BED;
}

export function isGardenWatered(beds: Beds): boolean {
  return beds.every(isBlooming);
}

// The watering took long enough to have happened, and not so long that the attempt is stale.
export function canFinishWatering(startedAt: Date | null, now: Date): boolean {
  if (!startedAt) {
    return false;
  }
  const seconds = (now.getTime() - startedAt.getTime()) / 1000;
  return seconds >= MIN_SECONDS && seconds <= MAX_SECONDS;
}
