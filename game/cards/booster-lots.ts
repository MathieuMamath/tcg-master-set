// How many boosters of a set can be opened at once: one, as always, or a lot of five or ten, cut in
// one go and shown together, for players with a full bag.

export const BOOSTER_LOT_SIZES = [1, 5, 10] as const;
export type BoosterLotSize = (typeof BOOSTER_LOT_SIZES)[number];

export function isBoosterLotSize(value: unknown): value is BoosterLotSize {
  return BOOSTER_LOT_SIZES.some((size) => size === value);
}

// The lots a player can open with this many boosters of a set in the bag.
export function lotSizesFor(inBag: number): BoosterLotSize[] {
  return BOOSTER_LOT_SIZES.filter((size) => size <= inBag);
}
