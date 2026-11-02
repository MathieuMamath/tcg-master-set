import { cardTier, type PullTier } from './pull-tier';

// What a second copy of a card brings. A usual booster full of duplicates pays back about a third
// of its price, so that only the rarest cards ever make a booster pay for itself.
const USUAL_RARITY_COINS: Record<string, number> = { Common: 2, Uncommon: 4 };
const RARE_COINS = 10;
const TIER_COINS: Record<Exclude<PullTier, 0 | 5>, number> = { 1: 25, 2: 50, 3: 100, 4: 200 };

export function duplicateCoins(rarity: string | null): number {
  const tier = cardTier(rarity);
  if (tier !== 0 && tier !== 5) {
    return TIER_COINS[tier];
  }
  if (rarity === null) {
    return USUAL_RARITY_COINS.Common;
  }
  return Object.hasOwn(USUAL_RARITY_COINS, rarity) ? USUAL_RARITY_COINS[rarity] : RARE_COINS;
}
