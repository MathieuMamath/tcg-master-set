import { describe, expect, test } from 'vitest';
import { APARTMENT } from './apartment';
import { isBlocked } from './collision';
import {
  canFinishQuest,
  canStartQuest,
  pickStains,
  QUEST_SECONDS,
  questDay,
  STAIN_COUNT,
  secondsLeft,
  stainSpots,
  stainsReached,
} from './quests';
import { CHARACTER_RADIUS, isInside, obstaclesOf } from './world';

const NOW = new Date('2026-11-02T12:00:00Z');
const secondsAgo = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);

describe('stains', () => {
  test('there are enough free spots for every stain', () => {
    expect(stainSpots().length).toBeGreaterThanOrEqual(STAIN_COUNT * 2);
  });

  test('every spot can be walked on', () => {
    for (const spot of stainSpots()) {
      expect(isInside(spot, APARTMENT.bounds)).toBe(true);
      expect(isBlocked(spot, obstaclesOf(APARTMENT), CHARACTER_RADIUS)).toBe(false);
    }
  });

  test('a quest gets all its stains, each in its own spot', () => {
    const stains = pickStains();
    const spots = new Set(stains.map(({ x, z }) => `${x},${z}`));

    expect(stains).toHaveLength(STAIN_COUNT);
    expect(spots.size).toBe(STAIN_COUNT);
  });

  test('walking over a stain reaches it, and a distant one does not', () => {
    const stains = [
      { id: 0, x: 0, z: 0 },
      { id: 1, x: 2, z: 2 },
    ];

    expect(stainsReached(stains, { x: 0.2, z: 0.1 }).map(({ id }) => id)).toEqual([0]);
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
