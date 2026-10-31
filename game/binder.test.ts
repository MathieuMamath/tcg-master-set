import { describe, expect, test } from 'vitest';
import {
  addToCollection,
  type BinderCard,
  binderSlots,
  clampPage,
  ownedSlotCount,
  pageCount,
  parseCollection,
  SLOTS_PER_PAGE,
  slotKey,
  slotsOnPage,
} from './binder';

function card(localId: string, variants: string[]): BinderCard {
  return {
    id: `set-${localId}`,
    localId,
    name: `Card ${localId}`,
    rarity: null,
    imageUrl: null,
    variants,
  };
}

describe('binderSlots', () => {
  test('orders cards by number, not alphabetically', () => {
    const slots = binderSlots([
      card('10', ['normal']),
      card('2', ['normal']),
      card('1', ['normal']),
    ]);

    expect(slots.map(({ card: { localId } }) => localId)).toEqual(['1', '2', '10']);
  });

  test('gives each variant its own slot, in a fixed order', () => {
    const slots = binderSlots([card('1', ['reverse', 'holo', 'normal'])]);

    expect(slots.map(({ variant }) => variant)).toEqual(['normal', 'holo', 'reverse']);
    expect(new Set(slots.map(({ key }) => key)).size).toBe(3);
  });

  test('gives a card with no variant no slot', () => {
    expect(binderSlots([card('1', [])])).toEqual([]);
  });
});

describe('pages', () => {
  test('counts whole pages, with at least one', () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(SLOTS_PER_PAGE)).toBe(1);
    expect(pageCount(SLOTS_PER_PAGE + 1)).toBe(2);
  });

  test('returns the slots of one page', () => {
    const slots = Array.from({ length: 20 }, (_, index) => index);

    expect(slotsOnPage(slots, 0)).toHaveLength(SLOTS_PER_PAGE);
    expect(slotsOnPage(slots, 2)).toEqual([18, 19]);
  });

  test('keeps the page within the binder', () => {
    expect(clampPage(-1, 20)).toBe(0);
    expect(clampPage(99, 20)).toBe(2);
  });
});

describe('the collection', () => {
  test('counts duplicates', () => {
    const collection = addToCollection({}, [
      { id: 'a', variant: 'normal' },
      { id: 'a', variant: 'normal' },
      { id: 'a', variant: 'reverse' },
    ]);

    expect(collection[slotKey('a', 'normal')]).toBe(2);
    expect(collection[slotKey('a', 'reverse')]).toBe(1);
  });

  test('leaves the previous collection untouched', () => {
    const before = { [slotKey('a', 'normal')]: 1 };

    addToCollection(before, [{ id: 'a', variant: 'normal' }]);

    expect(before[slotKey('a', 'normal')]).toBe(1);
  });

  test('progress counts slots, ignoring duplicates and unknown cards', () => {
    const slots = binderSlots([card('1', ['normal', 'reverse']), card('2', ['normal'])]);
    const collection = {
      [slotKey('set-1', 'normal')]: 3,
      [slotKey('unknown', 'normal')]: 1,
    };

    expect(ownedSlotCount(slots, collection)).toBe(1);
  });
});

describe('parseCollection', () => {
  test('reads back a saved collection', () => {
    const saved = { [slotKey('a', 'normal')]: 2 };

    expect(parseCollection(JSON.stringify(saved))).toEqual(saved);
  });

  test.each([
    ['nothing stored', null],
    ['invalid JSON', '{nope'],
    ['a list', '[1,2]'],
    ['a JSON null', 'null'],
  ])('treats %s as an empty collection', (_, stored) => {
    expect(parseCollection(stored)).toEqual({});
  });

  test('drops invalid counts and keeps valid ones', () => {
    const stored = JSON.stringify({ good: 2, zero: 0, negative: -1, text: 'many', half: 1.5 });

    expect(parseCollection(stored)).toEqual({ good: 2 });
  });
});
