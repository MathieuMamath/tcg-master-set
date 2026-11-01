import { describe, expect, test } from 'vitest';
import {
  addToCollection,
  type BinderCard,
  binderSlots,
  bindersToChoose,
  clampPage,
  ownedInSet,
  ownedSlotCount,
  pageCount,
  pagesShown,
  SLOTS_PER_PAGE,
  slotKey,
  slotsOnPage,
  turnPage,
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

describe('pages side by side', () => {
  const FIVE_PAGES = SLOTS_PER_PAGE * 5;

  test('shows one page at a time on a narrow screen', () => {
    expect(pagesShown(3, FIVE_PAGES, 1)).toEqual([3]);
  });

  test('shows the pair a page belongs to on a wide screen', () => {
    expect(pagesShown(0, FIVE_PAGES, 2)).toEqual([0, 1]);
    expect(pagesShown(3, FIVE_PAGES, 2)).toEqual([2, 3]);
  });

  test('leaves the last page alone when the total is odd', () => {
    expect(pagesShown(4, FIVE_PAGES, 2)).toEqual([4]);
  });

  test('turns one page or a whole pair', () => {
    expect(turnPage(1, 1, FIVE_PAGES, 1)).toBe(2);
    expect(turnPage(0, 1, FIVE_PAGES, 2)).toBe(2);
    expect(turnPage(3, -1, FIVE_PAGES, 2)).toBe(0);
  });

  test('stays within the binder', () => {
    expect(turnPage(0, -1, FIVE_PAGES, 2)).toBe(0);
    expect(turnPage(4, 1, FIVE_PAGES, 2)).toBe(4);
  });
});

describe('ownedInSet', () => {
  test('counts the versions owned in that set only, however many copies', () => {
    const collection = { 'set-a-1:normal': 3, 'set-a-1:reverse': 1, 'set-b-1:normal': 1 };

    expect(ownedInSet(collection, 'set-a')).toBe(2);
    expect(ownedInSet(collection, 'set-b')).toBe(1);
    expect(ownedInSet(collection, 'set-c')).toBe(0);
  });
});

describe('bindersToChoose', () => {
  const SETS = [
    { id: 'old-empty', releaseDate: '2020-01-01' },
    { id: 'new-empty', releaseDate: '2026-01-01' },
    { id: 'old-owned', releaseDate: '2021-01-01' },
    { id: 'new-owned', releaseDate: '2025-01-01' },
  ];
  const COLLECTION = { 'old-owned-1:normal': 1, 'new-owned-1:normal': 2, 'new-owned-2:holo': 1 };

  test('puts the binders with cards first, then goes from newest to oldest', () => {
    expect(bindersToChoose(SETS, COLLECTION).map(({ id }) => id)).toEqual([
      'new-owned',
      'old-owned',
      'new-empty',
      'old-empty',
    ]);
  });

  test('counts what the player owns in each', () => {
    expect(bindersToChoose(SETS, COLLECTION).map(({ owned }) => owned)).toEqual([2, 1, 0, 0]);
  });

  test('goes from newest to oldest when nothing is owned yet', () => {
    expect(bindersToChoose(SETS, {}).map(({ id }) => id)).toEqual([
      'new-empty',
      'new-owned',
      'old-owned',
      'old-empty',
    ]);
  });
});
