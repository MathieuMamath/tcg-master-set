import { expect, test } from 'vitest';
import { cardFoil } from './foil';

test('gives holos and reverses their own foil', () => {
  expect(cardFoil('holo')).toBe('holo');
  expect(cardFoil('reverse')).toBe('reverse');
});

test('gives the other special versions a shine, and plain cards nothing', () => {
  expect(cardFoil('firstEdition')).toBe('shine');
  expect(cardFoil('wPromo')).toBe('shine');
  expect(cardFoil('normal')).toBeNull();
});
