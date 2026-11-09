// The database's side of a player's wallet, shared by everything that pays or charges: their coins,
// boosters and binders, read in the same transaction as the change.

import { and, eq, gt, sql } from 'drizzle-orm';
import type { getDb } from '@/db/client';
import { playerBinders, playerBoosters, playerWallets } from '@/db/schema';
import { isPlayableSet, type SetId } from '@/game/cards/card-sets';
import { STARTING_COINS, type Wallet } from '@/game/cards/shop-dialogue';

// Either the database itself or a transaction of it.
type Database = ReturnType<typeof getDb>;

export type Reader = Pick<Database, 'select' | 'insert'>;

// A new player's wallet is created on first need, whatever the first request is.
// The player's coins at this point of a transaction, for the event of what just changed them, so
// that the log can tell how players' wealth moves over time.
export async function coinsNow(database: Reader, userId: string): Promise<number> {
  const [wallet] = await database
    .select({ coins: playerWallets.coins })
    .from(playerWallets)
    .where(eq(playerWallets.userId, userId));
  return wallet?.coins ?? 0;
}

export async function loadWallet(database: Reader, userId: string): Promise<Wallet> {
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

export async function loadBinders(database: Reader, userId: string): Promise<SetId[]> {
  const binders = await database
    .select({ setId: playerBinders.setId })
    .from(playerBinders)
    .where(eq(playerBinders.userId, userId));
  return binders.flatMap(({ setId }) => (isPlayableSet(setId) ? [setId] : []));
}

export async function addBooster(database: Pick<Database, 'insert'>, userId: string, setId: SetId) {
  await database
    .insert(playerBoosters)
    .values({ userId, setId, count: 1 })
    .onConflictDoUpdate({
      target: [playerBoosters.userId, playerBoosters.setId],
      set: { count: sql`${playerBoosters.count} + 1` },
    });
}
