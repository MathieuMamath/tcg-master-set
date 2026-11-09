import { describe, expect, it } from 'vitest';
import {
  canSleep,
  clockReading,
  isValidOffset,
  isWinter,
  MINUTES_PER_DAY,
  minuteOfDay,
  offsetAfterSleep,
  timeOfDay,
  WAKE_UP,
  weatherAt,
} from './clock';

// A real moment whose game clock reads midnight with no offset: a whole number of game days.
const MIDNIGHT = new Date(MINUTES_PER_DAY * 1000 * 1000);
const later = (seconds: number) => new Date(MIDNIGHT.getTime() + seconds * 1000);

describe('minuteOfDay', () => {
  it('moves on one game minute every real second', () => {
    expect(minuteOfDay(MIDNIGHT, 0)).toBe(0);
    expect(minuteOfDay(later(1), 0)).toBe(1);
    expect(minuteOfDay(later(90), 0)).toBe(90);
  });

  it('comes back round after a whole day of 24 real minutes', () => {
    expect(minuteOfDay(later(MINUTES_PER_DAY), 0)).toBe(0);
  });

  it('adds the player offset', () => {
    expect(minuteOfDay(MIDNIGHT, 600)).toBe(600);
  });
});

describe('timeOfDay', () => {
  it.each([
    [0, 'night'],
    [4 * 60 + 59, 'night'],
    [5 * 60, 'dawn'],
    [7 * 60, 'day'],
    [17 * 60 + 59, 'day'],
    [18 * 60, 'dusk'],
    [21 * 60, 'night'],
  ] as const)('reads minute %i as %s', (minute, expected) => {
    expect(timeOfDay(minute)).toBe(expected);
  });
});

describe('canSleep', () => {
  it('lets Pip sleep from eight in the evening until dawn', () => {
    expect(canSleep(19 * 60 + 59)).toBe(false);
    expect(canSleep(20 * 60)).toBe(true);
    expect(canSleep(2 * 60)).toBe(true);
    expect(canSleep(5 * 60)).toBe(false);
    expect(canSleep(12 * 60)).toBe(false);
  });
});

describe('offsetAfterSleep', () => {
  it('moves the clock on to seven in the morning', () => {
    for (const minute of [20 * 60, 23 * 60 + 30, 0, 4 * 60]) {
      const now = later(minute);
      const offset = offsetAfterSleep(now, 0);
      expect(minuteOfDay(now, offset)).toBe(WAKE_UP);
      expect(isValidOffset(offset)).toBe(true);
    }
  });

  it('builds on an earlier offset', () => {
    const now = later(10);
    const offset = offsetAfterSleep(now, 22 * 60);
    expect(minuteOfDay(now, offset)).toBe(WAKE_UP);
  });
});

describe('isValidOffset', () => {
  it('only takes whole minutes within a day', () => {
    expect(isValidOffset(0)).toBe(true);
    expect(isValidOffset(MINUTES_PER_DAY - 1)).toBe(true);
    expect(isValidOffset(MINUTES_PER_DAY)).toBe(false);
    expect(isValidOffset(-1)).toBe(false);
    expect(isValidOffset(1.5)).toBe(false);
    expect(isValidOffset('3')).toBe(false);
  });
});

describe('weatherAt', () => {
  const summer = new Date('2026-07-01T00:00:00Z').getTime();
  const winter = new Date('2026-01-01T00:00:00Z').getTime();
  const spells = (start: number) =>
    Array.from({ length: 400 }, (_, spell) => weatherAt(new Date(start + spell * 240_000), 0));

  it('holds for a whole spell of four game hours', () => {
    const start = new Date(Math.ceil(summer / 240_000) * 240_000);
    const weather = weatherAt(start, 0);
    expect(weatherAt(new Date(start.getTime() + 239_000), 0)).toBe(weather);
  });

  it('never snows outside winter, and rains and storms now and then', () => {
    const seen = new Set(spells(summer));
    expect(seen.has('snow')).toBe(false);
    expect(seen).toEqual(new Set(['fewClouds', 'cloudy', 'rain', 'storm']));
  });

  it('snows in winter instead of raining', () => {
    const seen = new Set(spells(winter));
    expect(seen).toEqual(new Set(['fewClouds', 'cloudy', 'snow']));
  });

  it('is mostly fair', () => {
    const fair = spells(summer).filter((weather) => weather === 'fewClouds').length;
    expect(fair).toBeGreaterThan(150);
    expect(fair).toBeLessThan(250);
  });
});

describe('isWinter', () => {
  it('runs from December to February', () => {
    expect(isWinter(new Date('2026-12-15T12:00:00Z'))).toBe(true);
    expect(isWinter(new Date('2026-02-28T12:00:00Z'))).toBe(true);
    expect(isWinter(new Date('2026-03-01T12:00:00Z'))).toBe(false);
    expect(isWinter(new Date('2026-11-30T12:00:00Z'))).toBe(false);
  });
});

describe('clockReading', () => {
  it('splits a minute of the day into hours and minutes', () => {
    expect(clockReading(7 * 60 + 5)).toEqual({ hours: 7, minutes: 5 });
    expect(clockReading(0)).toEqual({ hours: 0, minutes: 0 });
  });
});
