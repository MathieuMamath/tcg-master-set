import type { PlayableSet, SetId } from './card-sets';

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

// The raccoon triplets of the Card Den, by the ids their first stock had: `latest` is Filou, the
// eldest, `thisYear` Frimousse, the middle one, and `older` Fripouille, the youngest. The ids
// stay, because the event log records them.
export const SHOPKEEPER_STOCKS = ['latest', 'thisYear', 'older'] as const;

export type ShopkeeperStock = (typeof SHOPKEEPER_STOCKS)[number];

// The eldest's own shelf: the 30th anniversary set and the Mega Evolution series.
function isEldestSet(id: SetId): boolean {
  return id === '30th' || id.startsWith('me');
}

const newestFirst = (a: PlayableSet, b: PlayableSet) => b.releaseDate.localeCompare(a.releaseDate);

// Every set is on sale, each from one of the triplets. The eldest has the 30th anniversary and the
// Mega Evolution sets. The others share the rest by age: the middle one takes the older half, the
// youngest the newer one. Each shows hers newest first.
export function setsSoldBy(stock: ShopkeeperStock, sets: readonly PlayableSet[]): PlayableSet[] {
  if (stock === 'latest') {
    return sets.filter(({ id }) => isEldestSet(id)).sort(newestFirst);
  }
  const oldestFirst = sets.filter(({ id }) => !isEldestSet(id)).sort((a, b) => newestFirst(b, a));
  const half = Math.ceil(oldestFirst.length / 2);
  return (stock === 'thisYear' ? oldestFirst.slice(0, half) : oldestFirst.slice(half)).sort(
    newestFirst,
  );
}

// Mamie Noisette sells every set's binder, newest first. Owning a set's binder is what lets the
// player buy its boosters.
export function bindersForSale(sets: readonly PlayableSet[]): PlayableSet[] {
  return [...sets].sort(newestFirst);
}
