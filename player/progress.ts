import { and, eq, gt, gte, sql } from 'drizzle-orm';
import { loadBoosterPool, loadOpenedCards, type OpenedCard } from '@/cards/booster-pool';
import { getDb } from '@/db/client';
import { playerBoosters, playerCards, playerSpots, playerWallets } from '@/db/schema';
import { type Collection, slotKey } from '@/game/binder';
import { BOOSTER_RECIPES, openBooster } from '@/game/booster';
import { isPlayableSet, type SetId } from '@/game/card-sets';
import { type PlayerSpot, parseSpot } from '@/game/places';
import {
  BOOSTER_PRICE,
  type ShopkeeperLine,
  STARTING_COINS,
  type Wallet,
} from '@/game/shop-dialogue';

// Either the database itself or a transaction of it.
type Database = ReturnType<typeof getDb>;
type Reader = Pick<Database, 'select' | 'insert'>;

export type PlayerProgress = { wallet: Wallet; collection: Collection; spot: PlayerSpot | null };

export type OpenedBooster = {
  setName: string;
  logoUrl: string | null;
  cards: OpenedCard[];
  isGodPack: boolean;
  wallet: Wallet;
};

// A new player's wallet is created on first need, whatever the first request is.
async function loadWallet(database: Reader, userId: string): Promise<Wallet> {
  await database
    .insert(playerWallets)
    .values({ userId, coins: STARTING_COINS })
    .onConflictDoNothing();
  // One after the other, because a transaction can only run one query at a time.
  const [wallet] = await database
    .select({ coins: playerWallets.coins })
    .from(playerWallets)
    .where(eq(playerWallets.userId, userId));
  const boosters = await database
    .select({ setId: playerBoosters.setId, count: playerBoosters.count })
    .from(playerBoosters)
    .where(and(eq(playerBoosters.userId, userId), gt(playerBoosters.count, 0)));

  return {
    coins: wallet?.coins ?? 0,
    boosters: Object.fromEntries(
      boosters.flatMap(({ setId, count }) => (isPlayableSet(setId) ? [[setId, count]] : [])),
    ),
  };
}

export async function loadPlayerProgress(userId: string): Promise<PlayerProgress> {
  const db = getDb();
  const [wallet, cards, spots] = await Promise.all([
    loadWallet(db, userId),
    db
      .select({
        cardId: playerCards.cardId,
        variant: playerCards.variant,
        count: playerCards.count,
      })
      .from(playerCards)
      .where(eq(playerCards.userId, userId)),
    db
      .select({
        place: playerSpots.place,
        x: playerSpots.x,
        z: playerSpots.z,
        heading: playerSpots.heading,
      })
      .from(playerSpots)
      .where(eq(playerSpots.userId, userId)),
  ]);

  return {
    wallet,
    collection: Object.fromEntries(
      cards.map(({ cardId, variant, count }) => [slotKey(cardId, variant), count]),
    ),
    spot: parseSpot(spots[0]),
  };
}

export async function savePlayerSpot(userId: string, spot: PlayerSpot): Promise<void> {
  const { place, x, z, heading } = spot;
  await getDb()
    .insert(playerSpots)
    .values({ userId, place, x, z, heading })
    .onConflictDoUpdate({
      target: playerSpots.userId,
      set: { place, x, z, heading, updatedAt: new Date() },
    });
}

// The coins and the booster change together, or not at all. The coins are only taken if they are
// there, so that two purchases at once can never go below zero.
export async function buyBooster(
  userId: string,
  setId: SetId,
): Promise<{ wallet: Wallet; line: ShopkeeperLine }> {
  return getDb().transaction(async (transaction) => {
    await loadWallet(transaction, userId);
    const [paid] = await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} - ${BOOSTER_PRICE}`, updatedAt: new Date() })
      .where(and(eq(playerWallets.userId, userId), gte(playerWallets.coins, BOOSTER_PRICE)))
      .returning({ coins: playerWallets.coins });
    if (!paid) {
      return { wallet: await loadWallet(transaction, userId), line: 'notEnoughCoins' as const };
    }

    await transaction
      .insert(playerBoosters)
      .values({ userId, setId, count: 1 })
      .onConflictDoUpdate({
        target: [playerBoosters.userId, playerBoosters.setId],
        set: { count: sql`${playerBoosters.count} + 1` },
      });
    return { wallet: await loadWallet(transaction, userId), line: 'thanks' as const };
  });
}

// Returns null when the player has no booster of this set. Everything that can fail on reading
// the catalogue happens first, so that a failure never costs a booster.
export async function openOwnedBooster(
  userId: string,
  setId: SetId,
  locale: string,
): Promise<OpenedBooster | null> {
  const opened = openBooster(await loadBoosterPool(setId), BOOSTER_RECIPES[setId]);
  if (!opened) {
    throw new Error(`Set ${setId} can't fill a booster`);
  }
  const details = await loadOpenedCards(opened.cards, setId, locale);

  return getDb().transaction(async (transaction) => {
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

    await transaction
      .insert(playerCards)
      .values(opened.cards.map(({ cardId, variant }) => ({ userId, cardId, variant, count: 1 })))
      .onConflictDoUpdate({
        target: [playerCards.userId, playerCards.cardId, playerCards.variant],
        set: { count: sql`${playerCards.count} + 1` },
      });

    return {
      ...details,
      isGodPack: opened.isGodPack,
      wallet: await loadWallet(transaction, userId),
    };
  });
}
