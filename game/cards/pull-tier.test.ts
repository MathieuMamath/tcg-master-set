import { expect, test } from 'vitest';
import { BOOSTER_RECIPES } from './booster';
import { cardTier, packTier, stageCount, stageDuration } from './pull-tier';

test('the usual rarities get the plain opening', () => {
  expect(cardTier('Common')).toBe(0);
  expect(cardTier('Rare')).toBe(0);
  expect(cardTier(null)).toBe(0);
  expect(cardTier('A rarity from a future set')).toBe(0);
});

test('rarer cards reach higher tiers', () => {
  expect(cardTier('Double rare')).toBe(1);
  expect(cardTier('Illustration rare')).toBe(2);
  expect(cardTier('Special illustration rare')).toBe(3);
  expect(cardTier('Mega Hyper Rare')).toBe(4);
});

test('a rarity name inherited from objects counts as nothing', () => {
  expect(cardTier('constructor')).toBe(0);
});

test('tiers never go down along the reveal order of any set', () => {
  for (const { revealOrder } of Object.values(BOOSTER_RECIPES)) {
    const tiers = revealOrder.map(cardTier);
    expect(tiers).toEqual([...tiers].sort((first, second) => first - second));
  }
});

test('every god pack rarity is above the plain opening, or the rarest a set has to offer', () => {
  for (const { godPackRarities } of Object.values(BOOSTER_RECIPES)) {
    expect(Math.max(...godPackRarities.map(cardTier))).toBeGreaterThanOrEqual(3);
  }
});

test('a pack takes the tier of its best card', () => {
  expect(packTier([0, 0, 2, 1], false)).toBe(2);
  expect(packTier([], false)).toBe(0);
});

test('only a god pack reaches the top tier', () => {
  expect(packTier([1, 2], true)).toBe(5);
});

test('each tier adds a stage', () => {
  expect(stageCount(0)).toBe(1);
  expect(stageCount(5)).toBe(6);
});

test('a player who avoids motion gets shorter stages', () => {
  expect(stageDuration(true)).toBeLessThan(stageDuration(false));
});
