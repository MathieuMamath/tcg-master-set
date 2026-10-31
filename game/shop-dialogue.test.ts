import { describe, expect, test } from 'vitest';
import { BOOSTER_PRICE, buyBooster, STARTING_WALLET } from './shop-dialogue';

describe('buyBooster', () => {
  test('swaps the price for one booster and thanks the player', () => {
    const { wallet, line } = buyBooster({ coins: 250, boosters: 2 });

    expect(wallet).toEqual({ coins: 250 - BOOSTER_PRICE, boosters: 3 });
    expect(line).toBe('thanks');
  });

  test('accepts the exact price', () => {
    expect(buyBooster({ coins: BOOSTER_PRICE, boosters: 0 }).wallet).toEqual({
      coins: 0,
      boosters: 1,
    });
  });

  test('refuses when the player is short of coins, and changes nothing', () => {
    const before = { coins: BOOSTER_PRICE - 1, boosters: 1 };
    const { wallet, line } = buyBooster(before);

    expect(wallet).toEqual(before);
    expect(line).toBe('notEnoughCoins');
  });

  test('the starting coins buy three boosters and no more', () => {
    let wallet = STARTING_WALLET;
    for (let purchase = 0; purchase < 5; purchase++) {
      wallet = buyBooster(wallet).wallet;
    }

    expect(wallet).toEqual({ coins: 0, boosters: 3 });
  });
});
