// The things the player wears, each in one slot: a scarf, a hat and a piece of gear, worn at the
// same time and never mixed. The catalogue lives here, in the code, as every item needs its
// drawing anyway; the server reads its prices and slots from here, never from the browser.
export const ITEM_SLOTS = ['scarf', 'hat', 'gear'] as const;

export type ItemSlot = (typeof ITEM_SLOTS)[number];

type ItemDefinition = {
  slot: ItemSlot;
  // What it costs at the boutique. The starter items cost nothing: everyone has them.
  price: number;
};

// The boutique's scarves all cost the same for now, but each keeps its own price, as later items
// will differ.
export const SCARF_PRICE = 3000;

export const ITEMS = {
  blueStripes: { slot: 'scarf', price: 0 },
  tartan: { slot: 'scarf', price: SCARF_PRICE },
  pompomKnit: { slot: 'scarf', price: SCARF_PRICE },
  polkaBow: { slot: 'scarf', price: SCARF_PRICE },
  starryNight: { slot: 'scarf', price: SCARF_PRICE },
  satchel: { slot: 'gear', price: 0 },
} as const satisfies Record<string, ItemDefinition>;

export type ItemId = keyof typeof ITEMS;

type ItemIn<Slot extends ItemSlot> = {
  [Id in ItemId]: (typeof ITEMS)[Id]['slot'] extends Slot ? Id : never;
}[ItemId];

export type ScarfId = ItemIn<'scarf'>;
export type HatId = ItemIn<'hat'>;
export type GearId = ItemIn<'gear'>;

// What a player wears in each slot. A slot can be empty: none is for now but the hat, as there is
// no hat yet.
export type WornItems = { scarf: ScarfId | null; hat: HatId | null; gear: GearId | null };

// What everyone starts with.
export const STARTER_LOOK: WornItems = { scarf: 'blueStripes', hat: null, gear: 'satchel' };

// The slots that can be left empty, without the drawing missing anything.
const EMPTIABLE_SLOTS: readonly ItemSlot[] = ['hat'];

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

export function isItemId(value: unknown): value is ItemId {
  return typeof value === 'string' && Object.hasOwn(ITEMS, value);
}

// The items of a slot, in the catalogue's order.
export function itemsIn<Slot extends ItemSlot>(slot: Slot): ItemIn<Slot>[] {
  return ITEM_IDS.filter((id) => ITEMS[id].slot === slot) as ItemIn<Slot>[];
}

export function isStarterItem(id: ItemId): boolean {
  return ITEMS[id].price === 0;
}

// Whether the player has this item: one everyone starts with, or one they bought.
export function ownsItem(owned: readonly ItemId[], id: ItemId): boolean {
  return isStarterItem(id) || owned.includes(id);
}

// An item named by the boutique's fitting room, to buy.
export function parseItemRequest(value: unknown): ItemId | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { item } = value as Record<string, unknown>;
  return isItemId(item) ? item : null;
}

// A change of what is worn in one slot, checked for its shape: an item of that slot, or nothing
// where the slot may be left empty.
export function parseWearRequest(value: unknown): { slot: ItemSlot; item: ItemId | null } | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { slot, item } = value as Record<string, unknown>;
  if (!ITEM_SLOTS.some((known) => known === slot)) {
    return null;
  }
  const wornSlot = slot as ItemSlot;
  if (item === null) {
    return EMPTIABLE_SLOTS.includes(wornSlot) ? { slot: wornSlot, item: null } : null;
  }
  return isItemId(item) && ITEMS[item].slot === wornSlot ? { slot: wornSlot, item } : null;
}

// What the boutique answers to a purchase.
export type BoutiqueLine = 'thanks' | 'notEnoughCoins' | 'alreadyOwned' | 'notForSale';
