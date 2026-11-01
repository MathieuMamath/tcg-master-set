import { describe, expect, test } from 'vitest';
import type { PlayableSet } from './card-sets';
import {
  BOOSTER_PRICE,
  boosterCount,
  buyBooster,
  removeBooster,
  SHOPKEEPER_STOCKS,
  STARTING_WALLET,
  setsSoldBy,
  totalBoosters,
} from './shop-dialogue';

describe('buyBooster', () => {
  test('swaps the price for one booster of that set and thanks the player', () => {
    const { wallet, line } = buyBooster({ coins: 250, boosters: { swsh3: 2 } }, 'swsh3');

    expect(wallet).toEqual({ coins: 250 - BOOSTER_PRICE, boosters: { swsh3: 3 } });
    expect(line).toBe('thanks');
  });

  test('keeps the boosters of each set apart', () => {
    const { wallet } = buyBooster({ coins: 250, boosters: { swsh3: 2 } }, '30th');

    expect(wallet.boosters).toEqual({ swsh3: 2, '30th': 1 });
  });

  test('accepts the exact price', () => {
    expect(buyBooster({ coins: BOOSTER_PRICE, boosters: {} }, 'swsh3').wallet).toEqual({
      coins: 0,
      boosters: { swsh3: 1 },
    });
  });

  test('refuses when the player is short of coins, and changes nothing', () => {
    const before = { coins: BOOSTER_PRICE - 1, boosters: { swsh3: 1 } };
    const { wallet, line } = buyBooster(before, 'swsh3');

    expect(wallet).toEqual(before);
    expect(line).toBe('notEnoughCoins');
  });

  test('the starting coins buy ten boosters and no more', () => {
    let wallet = STARTING_WALLET;
    for (let purchase = 0; purchase < 12; purchase++) {
      wallet = buyBooster(wallet, purchase % 2 === 0 ? 'swsh3' : '30th').wallet;
    }

    expect(wallet.coins).toBe(0);
    expect(totalBoosters(wallet)).toBe(10);
  });
});

describe('removeBooster', () => {
  test('only takes a booster from that set', () => {
    const wallet = removeBooster({ coins: 0, boosters: { swsh3: 2, '30th': 1 } }, '30th');

    expect(boosterCount(wallet, '30th')).toBe(0);
    expect(boosterCount(wallet, 'swsh3')).toBe(2);
    expect(totalBoosters(wallet)).toBe(2);
  });

  test('never goes below zero', () => {
    expect(boosterCount(removeBooster(STARTING_WALLET, 'swsh3'), 'swsh3')).toBe(0);
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
