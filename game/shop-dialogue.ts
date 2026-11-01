import type { SetId } from './card-sets';

export const BOOSTER_PRICE = 100;

export type Wallet = {
  coins: number;
  boosters: Readonly<Partial<Record<SetId, number>>>;
};

// Provisional: until it moves to the database, the wallet only lives in the browser for one visit.
// The server will decide purchases, as for every other balance.
export const STARTING_WALLET: Wallet = { coins: 300, boosters: {} };

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
