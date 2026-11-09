import { describe, expect, test } from 'vitest';
import { EVERYDAY_ITEMS, fishItem, secondsUntilBite, TREASURE_CHANCE } from './fishing';

function rolls(...values: number[]) {
  return () => values.shift() ?? 0;
}

describe('fishItem', () => {
  test('one line in five brings up the treasure box', () => {
    expect(TREASURE_CHANCE).toBe(0.2);
    expect(fishItem(rolls(0))).toBe('treasure');
    expect(fishItem(rolls(0.19))).toBe('treasure');
  });

  test('otherwise it brings up one of his everyday things', () => {
    expect(fishItem(rolls(0.2, 0))).toBe(EVERYDAY_ITEMS[0]);
    expect(fishItem(rolls(0.99, 0.999))).toBe(EVERYDAY_ITEMS.at(-1));
  });

  test('every everyday thing can come up', () => {
    const found = new Set(
      EVERYDAY_ITEMS.map((_, index) => fishItem(rolls(0.5, (index + 0.5) / EVERYDAY_ITEMS.length))),
    );

    expect(found.size).toBe(EVERYDAY_ITEMS.length);
  });
});

describe('secondsUntilBite', () => {
  test('always leaves a short wait, but never a long one', () => {
    expect(secondsUntilBite(() => 0)).toBe(1.5);
    expect(secondsUntilBite(() => 0.999)).toBeLessThan(4);
  });
});
