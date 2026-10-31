import { expect, test } from 'vitest';
import { revealedLength } from './typewriter';

test('reveals nothing at the start', () => {
  expect(revealedLength(0, 20)).toBe(0);
});

test('reveals more as time passes', () => {
  expect(revealedLength(200, 100)).toBeLessThan(revealedLength(400, 100));
});

test('stops at the end of the text', () => {
  expect(revealedLength(60_000, 20)).toBe(20);
});
