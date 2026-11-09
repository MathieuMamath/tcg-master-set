import { describe, expect, test } from 'vitest';
import {
  BOOSTER_SCORE,
  basketballReward,
  COINS_SCORE,
  canFinishBasketball,
  cursorPosition,
  GAME_SECONDS,
  pointsAt,
  readyAt,
  SHOT_GAP_MS,
  scoreOfShots,
} from './basketball';

describe('cursorPosition', () => {
  test('starts at the left end, crosses, and comes back', () => {
    expect(cursorPosition(0, 0)).toBe(0);
    expect(cursorPosition(500, 0)).toBeCloseTo(0.5);
    expect(cursorPosition(1000, 0)).toBeCloseTo(1);
    expect(cursorPosition(1500, 0)).toBeCloseTo(0.5);
    expect(cursorPosition(2000, 0)).toBeCloseTo(0);
  });

  test('waits at the left end until the ball is back', () => {
    expect(cursorPosition(-100, 3)).toBe(0);
  });

  test('gets faster with each shot, up to a limit', () => {
    expect(cursorPosition(100, 10)).toBeGreaterThan(cursorPosition(100, 0));
    expect(cursorPosition(100, 200)).toBeCloseTo(cursorPosition(100, 25));
  });
});

describe('pointsAt', () => {
  test.each([
    [0.5, 3],
    [0.54, 3],
    [0.6, 2],
    [0.36, 2],
    [0.3, 0],
    [0, 0],
    [1, 0],
  ])('at %d gives %d points', (position, points) => {
    expect(pointsAt(position)).toBe(points);
  });
});

describe('scoreOfShots', () => {
  test('no shot scores nothing', () => {
    expect(scoreOfShots([])).toBe(0);
  });

  test('counts each shot from when the ball came back', () => {
    // At the centre of the first crossing, then at the centre of a slightly faster second one.
    const first = 500;
    const second = readyAt(first) + 490;

    expect(scoreOfShots([first, second])).toBe(6);
  });

  test('a shot at the end of the meter misses', () => {
    expect(scoreOfShots([50])).toBe(0);
  });

  test.each([
    ['not a list', '500'],
    ['nothing', undefined],
    ['not a number', ['500']],
    ['not finite', [Number.NaN]],
    ['before the start', [-1]],
    ['after the end', [GAME_SECONDS * 1000 + 1]],
    ['before the ball came back', [500, 500 + SHOT_GAP_MS - 1]],
    ['too many', Array.from({ length: 1000 }, (_, index) => index * SHOT_GAP_MS)],
  ])('refuses shots that are %s', (_, shots) => {
    expect(scoreOfShots(shots)).toBeNull();
  });
});

describe('canFinishBasketball', () => {
  const start = new Date('2026-01-01T00:00:00Z');
  const secondsIn = (seconds: number) => new Date(start.getTime() + seconds * 1000);

  test('needs the whole game to have gone by', () => {
    expect(canFinishBasketball(start, secondsIn(5))).toBe(false);
    expect(canFinishBasketball(start, secondsIn(GAME_SECONDS))).toBe(true);
  });

  test('refuses an attempt left behind long ago', () => {
    expect(canFinishBasketball(start, secondsIn(GAME_SECONDS + 60))).toBe(false);
  });
});

describe('basketballReward', () => {
  test.each([
    [0, 'none'],
    [COINS_SCORE - 1, 'none'],
    [COINS_SCORE, 'coins'],
    [BOOSTER_SCORE - 1, 'coins'],
    [BOOSTER_SCORE, 'booster'],
  ])('a score of %d gives %s', (score, reward) => {
    expect(basketballReward(score)).toBe(reward);
  });
});
