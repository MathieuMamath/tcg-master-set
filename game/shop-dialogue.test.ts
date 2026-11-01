import { describe, expect, test } from 'vitest';
import type { PlayableSet } from './card-sets';
import {
  BOOSTER_PRICE,
  boosterCount,
  SHOPKEEPER_STOCKS,
  STARTING_COINS,
  setsSoldBy,
  totalBoosters,
} from './shop-dialogue';

describe('the wallet', () => {
  const wallet = { coins: 0, boosters: { swsh3: 2, '30th': 1 } };

  test('counts the boosters of one set', () => {
    expect(boosterCount(wallet, 'swsh3')).toBe(2);
    expect(boosterCount(wallet, 'me05')).toBe(0);
  });

  test('counts all the boosters', () => {
    expect(totalBoosters(wallet)).toBe(3);
  });

  test('a new player can buy ten boosters', () => {
    expect(STARTING_COINS / BOOSTER_PRICE).toBe(10);
  });
});

describe('setsSoldBy', () => {
  const set = (id: PlayableSet['id'], releaseDate: string): PlayableSet => ({
    id,
    name: id,
    logoUrl: null,
    slotTotal: 1,
    releaseDate,
  });
  const SETS = [
    set('swsh3', '2020-01-01'),
    set('me05', '2026-07-01'),
    set('30th', '2026-09-01'),
    set('sv10', '2025-05-01'),
    set('me03', '2026-03-01'),
    set('me04', '2026-05-01'),
    set('me02', '2026-01-01'),
  ];
  const ids = (stock: (typeof SHOPKEEPER_STOCKS)[number], year = 2026) =>
    setsSoldBy(stock, SETS, year).map(({ id }) => id);

  test('the first shopkeeper sells the three newest sets', () => {
    expect(ids('latest')).toEqual(['30th', 'me05', 'me04']);
  });

  test('the second sells the rest of this year', () => {
    expect(ids('thisYear')).toEqual(['me03', 'me02']);
  });

  test('the third sells every older set', () => {
    expect(ids('older')).toEqual(['sv10', 'swsh3']);
  });

  test('every set is sold by exactly one shopkeeper, whatever the year', () => {
    for (const year of [2026, 2027]) {
      const sold = SHOPKEEPER_STOCKS.flatMap((stock) => ids(stock, year));

      expect([...sold].sort()).toEqual(SETS.map(({ id }) => id).sort());
    }
  });
});
