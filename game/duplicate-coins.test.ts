import { expect, test } from 'vitest';
import { BOOSTER_RECIPES } from './booster';
import { duplicateCoins } from './duplicate-coins';
import { BOOSTER_PRICE } from './shop-dialogue';

test('rarer cards are worth more', () => {
  expect(duplicateCoins('Common')).toBe(2);
  expect(duplicateCoins('Uncommon')).toBe(4);
  expect(duplicateCoins('Rare')).toBe(10);
  expect(duplicateCoins('Double rare')).toBe(25);
  expect(duplicateCoins('Illustration rare')).toBe(50);
  expect(duplicateCoins('Special illustration rare')).toBe(100);
  expect(duplicateCoins('Mega Hyper Rare')).toBe(200);
});

test('a card without a rarity is worth the least', () => {
  expect(duplicateCoins(null)).toBe(2);
});

test('a rarity name inherited from objects counts as a plain rare', () => {
  expect(duplicateCoins('constructor')).toBe(10);
});

test('values never go down along the reveal order of any set', () => {
  for (const { revealOrder } of Object.values(BOOSTER_RECIPES)) {
    const values = revealOrder.filter((rarity) => rarity !== 'reverse').map(duplicateCoins);
    expect(values).toEqual([...values].sort((first, second) => first - second));
  }
});

test('the usual outcome of each set pays back well under the price of a booster', () => {
  for (const { slots } of Object.values(BOOSTER_RECIPES)) {
    const total = slots.reduce((sum, [{ source }]) => {
      // A reverse is a common or uncommon card in most boosters.
      const worth = source === 'reverse' ? duplicateCoins('Uncommon') : duplicateCoins(source[0]);
      return sum + worth;
    }, 0);
    expect(total).toBeLessThan(BOOSTER_PRICE / 2);
  }
});
