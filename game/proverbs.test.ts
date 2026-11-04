import { expect, test } from 'vitest';
import en from '../messages/en.json';
import fr from '../messages/fr.json';
import { nextProverb, PROVERB_COUNT, pickProverb } from './proverbs';

test('every saying is written, in both languages', () => {
  expect(Object.keys(fr.Quest.grandpa.proverbs)).toHaveLength(PROVERB_COUNT);
  expect(Object.keys(en.Quest.grandpa.proverbs)).toHaveLength(PROVERB_COUNT);
});

test('picks any saying, from the first to the last', () => {
  expect(pickProverb(() => 0)).toBe(1);
  expect(pickProverb(() => 0.9999)).toBe(PROVERB_COUNT);
});

test('never gives the same saying twice in a row', () => {
  expect(nextProverb(1, () => 0)).toBe(2);
  expect(nextProverb(PROVERB_COUNT, () => 0.9999)).toBe(1);
  expect(nextProverb(5, () => 0)).toBe(1);
});
