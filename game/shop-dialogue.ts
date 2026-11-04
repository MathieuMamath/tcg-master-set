import type { PlayableSet, SetId } from './card-sets';
import { isSoldSet } from './card-sets';

export const BOOSTER_PRICE = 100;
export const BINDER_PRICE = 500;
// The most boosters one purchase can take, kept under a hundred. The player's coins are the real
// limit: this one only stops a request made by hand from asking for an absurd number.
export const MAX_BOOSTER_QUANTITY = 99;

// The most boosters the player can buy at once, at least one so that the picker always shows a
// number, while the coins decide whether the purchase goes through.
export function affordableBoosters(coins: number): number {
  return Math.max(1, Math.min(MAX_BOOSTER_QUANTITY, Math.floor(coins / BOOSTER_PRICE)));
}

// How many boosters a purchase asks for. Anything but a whole number in range is refused.
export function parseBoosterQuantity(value: string | null): number | null {
  if (value === null) {
    return 1;
  }
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_BOOSTER_QUANTITY
    ? quantity
    : null;
}

export type Wallet = {
  coins: number;
  boosters: Readonly<Partial<Record<SetId, number>>>;
};

export const STARTING_COINS = 1000;

export type ShopkeeperLine =
  | 'greeting'
  | 'thanks'
  | 'notEnoughCoins'
  | 'needsBinder'
  | 'alreadyOwned'
  | 'unavailable';

export function boosterCount(wallet: Wallet, setId: SetId): number {
  return wallet.boosters[setId] ?? 0;
}

export function totalBoosters(wallet: Wallet): number {
  return Object.values(wallet.boosters).reduce((total, count) => total + count, 0);
}

export const SHOPKEEPER_STOCKS = ['latest', 'thisYear', 'older'] as const;

export type ShopkeeperStock = (typeof SHOPKEEPER_STOCKS)[number];

const LATEST_SET_COUNT = 3;

// One shopkeeper has the three newest sets, one the rest of this year, one all the others.
export function setsSoldBy(
  stock: ShopkeeperStock,
  sets: readonly PlayableSet[],
  currentYear: number,
): PlayableSet[] {
  const newestFirst = sets
    .filter(({ id }) => isSoldSet(id))
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  if (stock === 'latest') {
    return newestFirst.slice(0, LATEST_SET_COUNT);
  }

  const isThisYear = ({ releaseDate }: PlayableSet) => releaseDate.startsWith(`${currentYear}-`);
  return newestFirst
    .slice(LATEST_SET_COUNT)
    .filter((set) => (stock === 'thisYear' ? isThisYear(set) : !isThisYear(set)));
}

// The binders on sale are those of the sets on sale, newest first. Opening a set's binder is what
// lets the player buy its boosters.
export function bindersForSale(sets: readonly PlayableSet[]): PlayableSet[] {
  return sets
    .filter(({ id }) => isSoldSet(id))
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}
