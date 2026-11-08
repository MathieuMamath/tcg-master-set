import { describe, expect, test } from 'vitest';
import {
  BEDS,
  bloomingBeds,
  canFinishWatering,
  isBlooming,
  isGardenWatered,
  POURS_PER_BED,
  pour,
  thirstyBeds,
} from './park-watering';

describe('the flower beds', () => {
  test('start thirsty, and bloom after their pourings', () => {
    let beds = thirstyBeds();
    expect(beds).toHaveLength(BEDS);
    expect(beds.some(isBlooming)).toBe(false);
    for (let pouring = 0; pouring < POURS_PER_BED; pouring++) {
      beds = pour(beds, 2);
    }
    expect(isBlooming(beds[2])).toBe(true);
    expect(pour(beds, 2)).toEqual(beds);
    expect(isGardenWatered(beds)).toBe(false);
  });

  test('show in flower once watered for the day', () => {
    expect(isGardenWatered(bloomingBeds())).toBe(true);
  });

  test('are all watered once every bed blooms', () => {
    let beds = thirstyBeds();
    for (let bed = 0; bed < BEDS; bed++) {
      for (let pouring = 0; pouring < POURS_PER_BED; pouring++) {
        beds = pour(beds, bed);
      }
    }
    expect(isGardenWatered(beds)).toBe(true);
  });
});

describe('canFinishWatering', () => {
  const startedAt = new Date(0);
  const at = (seconds: number) => new Date(seconds * 1000);

  test('needs the watering to have started, and to have taken a moment', () => {
    expect(canFinishWatering(null, at(10))).toBe(false);
    expect(canFinishWatering(startedAt, at(1))).toBe(false);
    expect(canFinishWatering(startedAt, at(10))).toBe(true);
  });

  test('refuses an attempt left too long', () => {
    expect(canFinishWatering(startedAt, at(600))).toBe(false);
  });
});
