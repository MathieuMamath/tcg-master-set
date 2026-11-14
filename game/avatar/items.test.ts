import { describe, expect, it } from 'vitest';
import {
  ITEM_IDS,
  ITEM_SLOTS,
  ITEMS,
  isItemId,
  itemsIn,
  ownsItem,
  parseItemRequest,
  parseWearRequest,
  STARTER_LOOK,
} from './items';

describe('the item catalogue', () => {
  it('gives every item one known slot', () => {
    for (const id of ITEM_IDS) {
      expect(ITEM_SLOTS).toContain(ITEMS[id].slot);
    }
    expect(new Set(ITEM_IDS).size).toBe(ITEM_IDS.length);
  });

  it('starts everyone with free items, of their own slot', () => {
    for (const slot of ITEM_SLOTS) {
      const starter = STARTER_LOOK[slot];
      if (starter !== null) {
        expect(ITEMS[starter].slot).toBe(slot);
        expect(ITEMS[starter].price).toBe(0);
        expect(ownsItem([], starter)).toBe(true);
      }
    }
  });

  it('sells four scarves at the boutique', () => {
    const forSale = itemsIn('scarf').filter((id) => ITEMS[id].price > 0);
    expect(forSale).toHaveLength(4);
  });

  it('only counts as owned what was bought, beside the starter items', () => {
    expect(ownsItem(['tartan'], 'tartan')).toBe(true);
    expect(ownsItem(['tartan'], 'polkaBow')).toBe(false);
  });
});

describe('requests', () => {
  it('knows its items only', () => {
    expect(isItemId('starryNight')).toBe(true);
    expect(isItemId('toString')).toBe(false);
    expect(parseItemRequest({ item: 'pompomKnit' })).toBe('pompomKnit');
    expect(parseItemRequest({ item: 'feather' })).toBeNull();
    expect(parseItemRequest(null)).toBeNull();
  });

  it('wears an item only in its own slot', () => {
    expect(parseWearRequest({ slot: 'scarf', item: 'tartan' })).toEqual({
      slot: 'scarf',
      item: 'tartan',
    });
    expect(parseWearRequest({ slot: 'gear', item: 'tartan' })).toBeNull();
    expect(parseWearRequest({ slot: 'cape', item: 'tartan' })).toBeNull();
  });

  it('only leaves empty the slots that may be', () => {
    expect(parseWearRequest({ slot: 'hat', item: null })).toEqual({ slot: 'hat', item: null });
    expect(parseWearRequest({ slot: 'scarf', item: null })).toBeNull();
    expect(parseWearRequest({ slot: 'gear', item: null })).toBeNull();
  });
});
