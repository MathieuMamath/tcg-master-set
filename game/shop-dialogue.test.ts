import { describe, expect, test } from 'vitest';
import {
  BOOSTER_PRICE,
  boosterCount,
  buyBooster,
  removeBooster,
  STARTING_WALLET,
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

  test('the starting coins buy three boosters and no more', () => {
    let wallet = STARTING_WALLET;
    for (let purchase = 0; purchase < 5; purchase++) {
      wallet = buyBooster(wallet, purchase % 2 === 0 ? 'swsh3' : '30th').wallet;
    }

    expect(wallet.coins).toBe(0);
    expect(totalBoosters(wallet)).toBe(3);
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
