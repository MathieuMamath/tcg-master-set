import type { PlayableSet, SetId } from './card-sets';

export const BOOSTER_PRICE = 100;

export type Wallet = {
  coins: number;
  boosters: Readonly<Partial<Record<SetId, number>>>;
};

export const STARTING_COINS = 1000;

export type ShopkeeperLine = 'greeting' | 'thanks' | 'notEnoughCoins' | 'unavailable';

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
  const newestFirst = [...sets].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  if (stock === 'latest') {
    return newestFirst.slice(0, LATEST_SET_COUNT);
  }

  const isThisYear = ({ releaseDate }: PlayableSet) => releaseDate.startsWith(`${currentYear}-`);
  return newestFirst
    .slice(LATEST_SET_COUNT)
    .filter((set) => (stock === 'thisYear' ? isThisYear(set) : !isThisYear(set)));
}
