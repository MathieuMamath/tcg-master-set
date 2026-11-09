// Buying boosters and binders, and opening a booster, which pays for its duplicates.

import { and, eq, gt, gte, sql } from 'drizzle-orm';
import { loadBoosterPool, loadOpenedCards, type RevealedCard } from '@/cards/booster-pool';
import { getDb } from '@/db/client';
import { playerBinders, playerBoosters, playerCards, playerWallets } from '@/db/schema';
import { firstCopies, slotKey } from '@/game/cards/binder';
import { boosterRecipe, openBooster } from '@/game/cards/booster';
import type { SetId } from '@/game/cards/card-sets';
import { duplicateCoins } from '@/game/cards/duplicate-coins';
import {
  BINDER_PRICE,
  BOOSTER_PRICE,
  type ShopkeeperLine,
  type Wallet,
} from '@/game/cards/shop-dialogue';
import { recordEvent } from './events';
import { coinsNow, loadBinders, loadWallet } from './wallet';

export type OpenedBooster = {
  setName: string;
  logoUrl: string | null;
  cards: RevealedCard[];
  isGodPack: boolean;
  wallet: Wallet;
};

// A set's boosters need its binder first. The coins and the booster change together, or not at all. The coins are only taken if they are
// there, so that two purchases at once can never go below zero.
// Several boosters of a set are paid for and added together, or not at all.
export async function buyBooster(
  userId: string,
  setId: SetId,
  quantity = 1,
): Promise<{ wallet: Wallet; line: ShopkeeperLine }> {
  const price = BOOSTER_PRICE * quantity;
  return getDb().transaction(async (transaction) => {
    await loadWallet(transaction, userId);
    const [binder] = await transaction
      .select({ setId: playerBinders.setId })
      .from(playerBinders)
      .where(and(eq(playerBinders.userId, userId), eq(playerBinders.setId, setId)));
    if (!binder) {
      return { wallet: await loadWallet(transaction, userId), line: 'needsBinder' as const };
    }

    const [paid] = await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} - ${price}`, updatedAt: new Date() })
      .where(and(eq(playerWallets.userId, userId), gte(playerWallets.coins, price)))
      .returning({ coins: playerWallets.coins });
    if (!paid) {
      return { wallet: await loadWallet(transaction, userId), line: 'notEnoughCoins' as const };
    }

    await transaction
      .insert(playerBoosters)
      .values({ userId, setId, count: quantity })
      .onConflictDoUpdate({
        target: [playerBoosters.userId, playerBoosters.setId],
        set: { count: sql`${playerBoosters.count} + ${quantity}` },
      });
    await recordEvent(transaction, userId, 'booster.bought', {
      coinsAfter: await coinsNow(transaction, userId),
      setId,
      quantity,
      coins: price,
    });
    return { wallet: await loadWallet(transaction, userId), line: 'thanks' as const };
  });
}

// The binder is added first, so that of two purchases at once only one goes on to pay.
export async function buyBinder(
  userId: string,
  setId: SetId,
): Promise<{ wallet: Wallet; binders: SetId[]; line: ShopkeeperLine }> {
  return getDb().transaction(async (transaction) => {
    await loadWallet(transaction, userId);
    const result = async (line: ShopkeeperLine) => ({
      wallet: await loadWallet(transaction, userId),
      binders: await loadBinders(transaction, userId),
      line,
    });

    const [added] = await transaction
      .insert(playerBinders)
      .values({ userId, setId })
      .onConflictDoNothing()
      .returning({ setId: playerBinders.setId });
    if (!added) {
      return result('alreadyOwned');
    }

    const [paid] = await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} - ${BINDER_PRICE}`, updatedAt: new Date() })
      .where(and(eq(playerWallets.userId, userId), gte(playerWallets.coins, BINDER_PRICE)))
      .returning({ coins: playerWallets.coins });
    if (!paid) {
      await transaction
        .delete(playerBinders)
        .where(and(eq(playerBinders.userId, userId), eq(playerBinders.setId, setId)));
      return result('notEnoughCoins');
    }

    await recordEvent(transaction, userId, 'binder.bought', {
      coinsAfter: await coinsNow(transaction, userId),
      setId,
      coins: BINDER_PRICE,
    });
    return result('thanks');
  });
}

// Returns null when the player has no booster of this set, and 'needsBinder' when they haven't
// bought its binder yet: boosters won from quests or coupons wait in the bag until it is bought.
// Everything that can fail on reading the catalogue happens first, so that a failure never costs
// a booster.
export async function openOwnedBooster(
  userId: string,
  setId: SetId,
  locale: string,
): Promise<OpenedBooster | 'needsBinder' | null> {
  const pool = await loadBoosterPool(setId);
  const opened = openBooster(pool, boosterRecipe(setId, pool));
  if (!opened) {
    throw new Error(`Set ${setId} can't fill a booster`);
  }
  const details = await loadOpenedCards(opened.cards, setId, locale);

  return getDb().transaction(async (transaction) => {
    const [binder] = await transaction
      .select({ setId: playerBinders.setId })
      .from(playerBinders)
      .where(and(eq(playerBinders.userId, userId), eq(playerBinders.setId, setId)));
    if (!binder) {
      return 'needsBinder' as const;
    }

    const [taken] = await transaction
      .update(playerBoosters)
      .set({ count: sql`${playerBoosters.count} - 1` })
      .where(
        and(
          eq(playerBoosters.userId, userId),
          eq(playerBoosters.setId, setId),
          gt(playerBoosters.count, 0),
        ),
      )
      .returning({ count: playerBoosters.count });
    if (!taken) {
      return null;
    }

    const added = await transaction
      .insert(playerCards)
      .values(opened.cards.map(({ cardId, variant }) => ({ userId, cardId, variant, count: 1 })))
      .onConflictDoUpdate({
        target: [playerCards.userId, playerCards.cardId, playerCards.variant],
        set: { count: sql`${playerCards.count} + 1` },
      })
      .returning({
        cardId: playerCards.cardId,
        variant: playerCards.variant,
        count: playerCards.count,
      });
    const firsts = firstCopies(added);
    const rarities = new Map(pool.map(({ id, rarity }) => [id, rarity]));
    const cards = details.cards.map((card) => {
      const isNew = firsts.has(slotKey(card.id, card.variant));
      return { ...card, isNew, coins: isNew ? 0 : duplicateCoins(rarities.get(card.id) ?? null) };
    });

    // In the same transaction, so that the coins can't be lost or earned twice.
    const duplicateTotal = cards.reduce((total, { coins }) => total + coins, 0);
    await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} + ${duplicateTotal}`, updatedAt: new Date() })
      .where(eq(playerWallets.userId, userId));
    await recordEvent(transaction, userId, 'booster.opened', {
      coinsAfter: await coinsNow(transaction, userId),
      setId,
      isGodPack: opened.isGodPack,
      bestTier: Math.max(0, ...cards.map(({ tier }) => tier)),
      newCards: cards.filter(({ isNew }) => isNew).length,
      duplicateCoins: duplicateTotal,
      cards: opened.cards.map(({ cardId, variant }) => ({ cardId, variant })),
    });

    return {
      ...details,
      cards,
      isGodPack: opened.isGodPack,
      wallet: await loadWallet(transaction, userId),
    };
  });
}
