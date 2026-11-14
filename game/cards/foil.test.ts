import { expect, test } from 'vitest';
import { cardFoil, isFullArtRarity } from './foil';

test('gives holos and reverses their own foil', () => {
  expect(cardFoil('holo')).toBe('holo');
  expect(cardFoil('reverse')).toBe('reverse');
});

test('spreads a holo foil over a card whose illustration fills it', () => {
  expect(cardFoil('holo', true)).toBe('fullArt');
  expect(cardFoil('reverse', true)).toBe('reverse');
});

test('gives the other special versions a shine, and plain cards nothing', () => {
  expect(cardFoil('firstEdition')).toBe('shine');
  expect(cardFoil('wPromo')).toBe('shine');
  expect(cardFoil('normal')).toBeNull();
});

test('knows the rarities whose illustration covers the card', () => {
  for (const rarity of [
    'Double rare',
    'Illustration rare',
    'Special illustration rare',
    'Ultra Rare',
    'Hyper rare',
    'Holo Rare VMAX',
  ]) {
    expect(isFullArtRarity(rarity)).toBe(true);
  }
  for (const rarity of ['Rare', 'Holo Rare', 'Rare Holo', 'Common', 'Radiant Rare', null]) {
    expect(isFullArtRarity(rarity)).toBe(false);
  }
});
