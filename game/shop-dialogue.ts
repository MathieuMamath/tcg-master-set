export const BOOSTER_PRICE = 100;

export type Wallet = {
  coins: number;
  boosters: number;
};

// Provisional: until player accounts exist, the wallet only lives in the browser for one visit.
// The server will decide purchases, as for every other balance.
export const STARTING_WALLET: Wallet = { coins: 300, boosters: 0 };

export type ShopkeeperLine = 'greeting' | 'thanks' | 'notEnoughCoins';

export function buyBooster(wallet: Wallet): { wallet: Wallet; line: ShopkeeperLine } {
  if (wallet.coins < BOOSTER_PRICE) {
    return { wallet, line: 'notEnoughCoins' };
  }

  return {
    wallet: { coins: wallet.coins - BOOSTER_PRICE, boosters: wallet.boosters + 1 },
    line: 'thanks',
  };
}
