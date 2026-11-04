import { describe, expect, test } from 'vitest';
import type { PlayableSet } from './card-sets';
import {
  affordableBoosters,
  BOOSTER_PRICE,
  bindersForSale,
  boosterCount,
  MAX_BOOSTER_QUANTITY,
  parseBoosterQuantity,
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

  test('no shopkeeper sells a set that only has a binder', () => {
    const withUnsold = [set('base1', '2026-10-01'), ...SETS];

    for (const stock of SHOPKEEPER_STOCKS) {
      expect(setsSoldBy(stock, withUnsold, 2026).map(({ id }) => id)).not.toContain('base1');
    }
  });

  test('the library only sells binders of the sets on sale, newest first', () => {
    const withUnsold = [set('base1', '2026-10-01'), ...SETS];

    expect(bindersForSale(withUnsold).map(({ id }) => id)).toEqual([
      '30th',
      'me05',
      'me04',
      'me03',
      'me02',
      'sv10',
      'swsh3',
    ]);
  });

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

describe('parseBoosterQuantity', () => {
  test('takes one booster when no quantity is asked', () => {
    expect(parseBoosterQuantity(null)).toBe(1);
  });

  test('takes any whole number up to the most a purchase allows', () => {
    expect(parseBoosterQuantity('3')).toBe(3);
    expect(parseBoosterQuantity(String(MAX_BOOSTER_QUANTITY))).toBe(MAX_BOOSTER_QUANTITY);
  });

  test('refuses anything else', () => {
    for (const value of ['0', '-1', '2.5', 'abc', '', String(MAX_BOOSTER_QUANTITY + 1)]) {
      expect(parseBoosterQuantity(value)).toBeNull();
    }
  });
});

describe('affordableBoosters', () => {
  test('goes as far as the coins allow', () => {
    expect(affordableBoosters(2008)).toBe(20);
    expect(affordableBoosters(BOOSTER_PRICE)).toBe(1);
  });

  test('stays under a hundred', () => {
    expect(affordableBoosters(1_000_000)).toBe(MAX_BOOSTER_QUANTITY);
    expect(MAX_BOOSTER_QUANTITY).toBe(99);
  });

  test('still offers one booster to a player who has too few coins', () => {
    expect(affordableBoosters(0)).toBe(1);
  });
});
