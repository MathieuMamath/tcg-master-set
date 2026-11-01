import type { PlayableSet, SetId } from './card-sets';

export const BOOSTER_PRICE = 100;

export type Wallet = {
  coins: number;
  boosters: Readonly<Partial<Record<SetId, number>>>;
};

// Provisional: until it moves to the database, the wallet only lives in the browser for one visit.
// The server will decide purchases, as for every other balance.
export const STARTING_WALLET: Wallet = { coins: 1000, boosters: {} };

export type ShopkeeperLine = 'greeting' | 'thanks' | 'notEnoughCoins';

export function boosterCount(wallet: Wallet, setId: SetId): number {
  return wallet.boosters[setId] ?? 0;
}

export function totalBoosters(wallet: Wallet): number {
  return Object.values(wallet.boosters).reduce((total, count) => total + count, 0);
}

export function buyBooster(wallet: Wallet, setId: SetId): { wallet: Wallet; line: ShopkeeperLine } {
  if (wallet.coins < BOOSTER_PRICE) {
    return { wallet, line: 'notEnoughCoins' };
  }

  return {
    wallet: {
      coins: wallet.coins - BOOSTER_PRICE,
      boosters: { ...wallet.boosters, [setId]: boosterCount(wallet, setId) + 1 },
    },
    line: 'thanks',
  };
}

export function removeBooster(wallet: Wallet, setId: SetId): Wallet {
  return {
    ...wallet,
    boosters: { ...wallet.boosters, [setId]: Math.max(boosterCount(wallet, setId) - 1, 0) },
  };
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
