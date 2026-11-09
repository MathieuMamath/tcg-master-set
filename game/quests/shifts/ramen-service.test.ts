import { describe, expect, test } from 'vitest';
import {
  canTouchTable,
  dishInHand,
  EAT_MS,
  SERVICE_MISTAKE_LIMIT,
  SERVICE_TABLES,
  serviceGuests,
  servicePoints,
  simulateService,
} from './ramen-service';
import { perfectService } from './ramen-service.test-helpers';

const SEED = 4242;
const guests = serviceGuests(SEED);
const firstReady = guests[0].arrivesAt + guests[0].cookMs;

describe('the guests', () => {
  test('come in together at first, then more often, and wait less, as the shift goes on', () => {
    expect(guests[1].arrivesAt - guests[0].arrivesAt).toBeLessThan(1000);
    const gaps = guests
      .slice(4)
      .map((guest, index) => guest.arrivesAt - guests[index + 3].arrivesAt);
    expect(Math.max(...gaps.slice(-10))).toBeLessThan(Math.max(...gaps.slice(0, 10)));
    expect(guests.at(-1)?.patience).toBeLessThan(guests[0].patience);
  });

  test('are the same from the same seed', () => {
    expect(serviceGuests(SEED)).toEqual(guests);
  });
});

describe('the restaurant', () => {
  test('seats the first guests, then sends their bowls out of the kitchen', () => {
    const seated = simulateService(SEED, [], 0);
    expect(seated?.tables[0]?.guest).toBe(0);
    expect(seated && dishInHand(seated)).toBeNull();
    expect(seated && canTouchTable(seated, 0)).toBe(false);

    const cooked = simulateService(SEED, [], firstReady);
    expect(cooked && dishInHand(cooked)).not.toBeNull();
  });

  test('a served guest eats, then leaves the table to clear, and the next one sits once it is', () => {
    const state = simulateService(SEED, [], firstReady);
    const hand = state && dishInHand(state);
    const table = state?.tables.findIndex(
      (seat) => seat?.outcome === 'waiting' && guests[seat.guest].dish === hand?.dish,
    );
    if (table === undefined || table < 0) {
      throw new Error('Nobody ordered the first bowl');
    }
    const served = simulateService(SEED, [[firstReady, table]], firstReady);
    expect(served?.served).toBe(1);
    expect(served?.tips).toBe(1);
    expect(served?.tables[table]?.outcome).toBe('eating');

    const gone = simulateService(SEED, [[firstReady, table]], firstReady + EAT_MS);
    expect(gone?.tables[table]?.outcome).toBe('dirty');

    const clearedAt = firstReady + EAT_MS + 100;
    const cleared = simulateService(
      SEED,
      [
        [firstReady, table],
        [clearedAt, table],
      ],
      clearedAt,
    );
    expect(cleared?.moments.at(-1)?.kind).toBe('cleared');
  });

  test('counts a bowl brought to the wrong table as a mistake, and keeps it in hand', () => {
    const state = simulateService(SEED, [], firstReady);
    const hand = state && dishInHand(state);
    const wrong = state?.tables.findIndex(
      (seat) => !seat || guests[seat.guest].dish !== hand?.dish,
    );
    const table = wrong === undefined || wrong < 0 ? SERVICE_TABLES - 1 : wrong;
    const after = simulateService(SEED, [[firstReady, table]], firstReady);
    expect(after?.mistakes).toBe(1);
    expect(after?.streak).toBe(0);
    expect(after && dishInHand(after)?.dish).toBe(hand?.dish);
  });

  test('lets a guest left waiting too long leave angry', () => {
    const at = guests[0].arrivesAt + guests[0].patience + 1;
    const state = simulateService(SEED, [], at);
    expect(state?.moments.some(({ kind }) => kind === 'angry')).toBe(true);
    expect(state?.mistakes).toBeGreaterThan(0);
  });

  test('ends the shift at the last mistake, and refuses presses after it', () => {
    const state = simulateService(SEED, [], 60_000);
    expect(state?.mistakes).toBe(SERVICE_MISTAKE_LIMIT);
    const after = (state?.endedAt ?? 0) + 2000;
    expect(simulateService(SEED, [[after, 0]], after)).toBeNull();
  });

  test('refuses a touch that does nothing', () => {
    expect(simulateService(SEED, [[0, 0]], 0)).toBeNull();
  });

  test('a perfect waiter serves every guest, with no mistake', () => {
    const state = simulateService(SEED, perfectService(SEED, 60_000), 60_000);
    expect(state?.mistakes).toBe(0);
    expect(servicePoints(state ?? { served: 0, tips: 0 })).toBeGreaterThan(30);
  });
});
