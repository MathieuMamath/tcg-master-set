import { describe, expect, test } from 'vitest';
import { FLAT, interactionAlong, LEA_X } from '../world/side-rooms';
import {
  canFinishQuest,
  canStartQuest,
  pickStains,
  QUEST_SECONDS,
  questDay,
  SCRUBS_PER_STAIN,
  STAIN_COUNT,
  scrubStain,
  secondsLeft,
  stainAlong,
  stainSpots,
} from './quests';

const NOW = new Date('2026-11-02T12:00:00Z');
const secondsAgo = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);

describe('dust on the walls', () => {
  test('every spot can be walked to, and none is at the door', () => {
    for (const x of stainSpots()) {
      expect(x).toBeGreaterThanOrEqual(FLAT.bounds.minX);
      expect(x).toBeLessThanOrEqual(FLAT.bounds.maxX);
      expect(interactionAlong(FLAT, x)).not.toBe('leaveFlat');
      // Léa and her desk would hide the wall behind them.
      expect(interactionAlong(FLAT, x)).not.toBe('grandma');
      expect(x).toBeLessThan(LEA_X);
    }
  });

  test('a quest gets all its patches, spread apart along the wall', () => {
    for (let seed = 0; seed < 20; seed++) {
      let state = seed;
      const random = () => {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
      };
      const stains = pickStains(random);
      const xs = stains.map(({ x }) => x).sort((a, b) => a - b);

      expect(stains).toHaveLength(STAIN_COUNT);
      for (let index = 1; index < xs.length; index++) {
        expect(xs[index] - xs[index - 1]).toBeGreaterThanOrEqual(0.7);
      }
    }
  });

  test('standing below a patch reaches it, and a distant one does not', () => {
    const stains = [
      { id: 0, x: 0, height: 2, scrubsLeft: 3 },
      { id: 1, x: 2, height: 2, scrubsLeft: 3 },
    ];

    expect(stainAlong(stains, 0.3)?.id).toBe(0);
    expect(stainAlong(stains, 1)).toBeNull();
  });

  test('a patch goes after its rubs, and only that one', () => {
    let stains = [
      { id: 0, x: 0, height: 2, scrubsLeft: SCRUBS_PER_STAIN },
      { id: 1, x: 2, height: 2, scrubsLeft: SCRUBS_PER_STAIN },
    ];
    for (let rub = 1; rub < SCRUBS_PER_STAIN; rub++) {
      stains = scrubStain(stains, 0);
    }

    expect(stains.map(({ id }) => id)).toEqual([0, 1]);
    expect(scrubStain(stains, 0).map(({ id }) => id)).toEqual([1]);
  });
});

describe('the quest over time', () => {
  test('can start with no reward today', () => {
    expect(canStartQuest({ startedAt: null, completedOn: null }, NOW)).toBe(true);
    expect(canStartQuest({ startedAt: null, completedOn: '2026-11-01' }, NOW)).toBe(true);
  });

  test('cannot start again the day it was rewarded', () => {
    expect(canStartQuest({ startedAt: null, completedOn: questDay(NOW) }, NOW)).toBe(false);
  });

  test('finishes within the time limit', () => {
    expect(canFinishQuest({ startedAt: secondsAgo(20), completedOn: null }, NOW)).toBe(true);
  });

  test('refuses a finish without a start', () => {
    expect(canFinishQuest({ startedAt: null, completedOn: null }, NOW)).toBe(false);
  });

  test('refuses a finish too soon to be real', () => {
    expect(canFinishQuest({ startedAt: secondsAgo(1), completedOn: null }, NOW)).toBe(false);
  });

  test('refuses a finish after the time limit', () => {
    const late = secondsAgo(QUEST_SECONDS + 60);

    expect(canFinishQuest({ startedAt: late, completedOn: null }, NOW)).toBe(false);
  });

  test('refuses a second reward the same day', () => {
    const attempt = { startedAt: secondsAgo(20), completedOn: questDay(NOW) };

    expect(canFinishQuest(attempt, NOW)).toBe(false);
  });

  test('the time left counts down to zero', () => {
    expect(secondsLeft(0, 10_000)).toBe(QUEST_SECONDS - 10);
    expect(secondsLeft(0, (QUEST_SECONDS + 10) * 1000)).toBe(0);
  });
});
