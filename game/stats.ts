// The periods Mme Hulotte's reports cover: today, by UTC date like the quests, the last seven
// days, the last thirty, or since the beginning.
export const STATS_PERIODS = ['day', 'week', 'month', 'all'] as const;
export type StatsPeriod = (typeof STATS_PERIODS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

export function isStatsPeriod(value: unknown): value is StatsPeriod {
  return STATS_PERIODS.some((period) => period === value);
}

// When the period starts, or null for since the beginning.
export function periodStart(period: StatsPeriod, now: Date): Date | null {
  if (period === 'all') {
    return null;
  }
  if (period === 'day') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  return new Date(now.getTime() - (period === 'week' ? 7 : 30) * DAY_MS);
}

// The charts follow the period in steps: hours today, days over seven or thirty days, and weeks
// since the start, for the last twelve of them.
export type BucketUnit = 'hour' | 'day' | 'week';
export const WEEKS_SINCE_START = 12;

export type StatsBuckets = { unit: BucketUnit; start: Date; keys: string[] };

const HOUR_MS = 60 * 60 * 1000;

// A bucket's key, as Postgres's date_trunc names it in UTC: the hour or the day it starts on.
export function bucketKey(unit: BucketUnit, start: Date): string {
  return unit === 'hour' ? start.toISOString().slice(0, 13) : start.toISOString().slice(0, 10);
}

export function statsBuckets(period: StatsPeriod, now: Date): StatsBuckets {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (period === 'day') {
    const keys = Array.from({ length: 24 }, (_, hour) =>
      bucketKey('hour', new Date(today.getTime() + hour * HOUR_MS)),
    );
    return { unit: 'hour', start: today, keys };
  }
  if (period === 'all') {
    // Weeks start on Monday, as date_trunc has them.
    const monday = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * DAY_MS);
    const first = new Date(monday.getTime() - (WEEKS_SINCE_START - 1) * 7 * DAY_MS);
    const keys = Array.from({ length: WEEKS_SINCE_START }, (_, week) =>
      bucketKey('week', new Date(first.getTime() + week * 7 * DAY_MS)),
    );
    return { unit: 'week', start: first, keys };
  }
  const days = period === 'week' ? 7 : 30;
  const first = new Date(today.getTime() - (days - 1) * DAY_MS);
  const keys = Array.from({ length: days }, (_, day) =>
    bucketKey('day', new Date(first.getTime() + day * DAY_MS)),
  );
  return { unit: 'day', start: first, keys };
}
