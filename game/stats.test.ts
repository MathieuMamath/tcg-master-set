import { expect, test } from 'vitest';
import { isStatsPeriod, periodStart, statsBuckets, WEEKS_SINCE_START } from './stats';

const NOW = new Date('2026-11-05T15:30:00Z');

test('today starts at midnight UTC', () => {
  expect(periodStart('day', NOW)).toEqual(new Date('2026-11-05T00:00:00Z'));
});

test('a week and a month reach back seven and thirty days', () => {
  expect(periodStart('week', NOW)).toEqual(new Date('2026-10-29T15:30:00Z'));
  expect(periodStart('month', NOW)).toEqual(new Date('2026-10-06T15:30:00Z'));
});

test('since the beginning has no start', () => {
  expect(periodStart('all', NOW)).toBeNull();
});

test('reads only the known periods', () => {
  expect(isStatsPeriod('week')).toBe(true);
  expect(isStatsPeriod('year')).toBe(false);
  expect(isStatsPeriod(undefined)).toBe(false);
});

test('today is charted by the hour', () => {
  const buckets = statsBuckets('day', NOW);

  expect(buckets.unit).toBe('hour');
  expect(buckets.keys).toHaveLength(24);
  expect(buckets.keys[0]).toBe('2026-11-05T00');
  expect(buckets.keys.at(-1)).toBe('2026-11-05T23');
});

test('seven and thirty days are charted by the day, ending today', () => {
  const week = statsBuckets('week', NOW);
  const month = statsBuckets('month', NOW);

  expect(week.unit).toBe('day');
  expect(week.keys).toEqual([
    '2026-10-30',
    '2026-10-31',
    '2026-11-01',
    '2026-11-02',
    '2026-11-03',
    '2026-11-04',
    '2026-11-05',
  ]);
  expect(month.keys).toHaveLength(30);
  expect(month.start).toEqual(new Date('2026-10-07T00:00:00Z'));
});

test('since the start is charted by the week, from Mondays', () => {
  const buckets = statsBuckets('all', NOW);

  expect(buckets.unit).toBe('week');
  expect(buckets.keys).toHaveLength(WEEKS_SINCE_START);
  // 5 November 2026 is a Thursday: its week starts on Monday the 2nd.
  expect(buckets.keys.at(-1)).toBe('2026-11-02');
  expect(buckets.keys[0]).toBe('2026-08-17');
});
