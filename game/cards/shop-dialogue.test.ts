import { describe, expect, test } from 'vitest';
import type { PlayableSet } from './card-sets';
import {
  affordableBoosters,
  BOOSTER_PRICE,
  bindersForSale,
  boosterCount,
  clampBoosterQuantity,
  MAX_BOOSTER_QUANTITY,
  parseBoosterQuantity,
  SHOPKEEPER_STOCKS,
  STARTING_COINS,
  setsSoldBy,
  totalBoosters,
  typedBoosterQuantity,
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
    set('base1', '1999-01-09'),
    set('me01', '2025-09-01'),
    set('xy1', '2014-02-05'),
    set('dp1', '2007-05-01'),
    set('neo1', '2000-12-16'),
  ];
  const ids = (stock: (typeof SHOPKEEPER_STOCKS)[number]) =>
    setsSoldBy(stock, SETS).map(({ id }) => id);

  test('the eldest sells the 30th anniversary and the Mega Evolution sets, newest first', () => {
    expect(ids('latest')).toEqual(['30th', 'me05', 'me01']);
  });

  test('the middle one sells the older half of the rest, newest first', () => {
    expect(ids('thisYear')).toEqual(['dp1', 'neo1', 'base1']);
  });

  test('the youngest sells the newer half', () => {
    expect(ids('older')).toEqual(['sv10', 'swsh3', 'xy1']);
  });

  test('with an odd number left, the middle one takes the extra set', () => {
    const odd = [...SETS, set('ex1', '2003-06-18')];

    expect(setsSoldBy('thisYear', odd)).toHaveLength(4);
    expect(setsSoldBy('older', odd)).toHaveLength(3);
  });

  test('every set is sold by exactly one shopkeeper', () => {
    const sold = SHOPKEEPER_STOCKS.flatMap((stock) => ids(stock));

    expect([...sold].sort()).toEqual(SETS.map(({ id }) => id).sort());
  });

  test("the library sells every set's binder, newest first", () => {
    expect(bindersForSale(SETS).map(({ id }) => id)).toEqual([
      '30th',
      'me05',
      'me01',
      'sv10',
      'swsh3',
      'xy1',
      'dp1',
      'neo1',
      'base1',
    ]);
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

describe('the quantity picked in the shop window', () => {
  test('stays between one and the most the player can buy', () => {
    expect(clampBoosterQuantity(0, 20)).toBe(1);
    expect(clampBoosterQuantity(-4, 20)).toBe(1);
    expect(clampBoosterQuantity(12, 20)).toBe(12);
    expect(clampBoosterQuantity(35, 20)).toBe(20);
  });

  test('keeps only the digits typed, held in range', () => {
    expect(typedBoosterQuantity('20', 99)).toBe(20);
    expect(typedBoosterQuantity(' 1a5 ', 99)).toBe(15);
    expect(typedBoosterQuantity('500', 99)).toBe(99);
    expect(typedBoosterQuantity('0', 99)).toBe(1);
  });

  test('waits while the field is empty', () => {
    expect(typedBoosterQuantity('', 99)).toBeNull();
    expect(typedBoosterQuantity('abc', 99)).toBeNull();
  });
});
