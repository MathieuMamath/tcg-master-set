// Bérénice's raffle.

import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { playerQuests, playerWallets } from '@/db/schema';
import type { Wallet } from '@/game/cards/shop-dialogue';
import { canStartQuest, questDay } from '@/game/quests/quests';
import { drawRaffle, RAFFLE_COINS, RAFFLE_QUEST, type RaffleOutcome } from '@/game/quests/raffle';
import { recordEvent } from '../events';
import { coinsNow, loadWallet } from '../wallet';

export type RaffleDraw =
  | { hasDrawn: false; wallet: Wallet }
  | { hasDrawn: true; outcome: RaffleOutcome; coins: number; wallet: Wallet };

// One turn of the drum a day, won or not. The ball is drawn here, and paid in the transaction that
// uses up the day's turn, so that it can't be drawn twice.
export async function drawRaffleBall(userId: string): Promise<RaffleDraw> {
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    await loadWallet(transaction, userId);
    const quest = and(eq(playerQuests.userId, userId), eq(playerQuests.questId, RAFFLE_QUEST));
    const [attempt] = await transaction
      .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(quest)
      .for('update');
    if (attempt && !canStartQuest(attempt, now)) {
      return { hasDrawn: false, wallet: await loadWallet(transaction, userId) };
    }
    await transaction
      .insert(playerQuests)
      .values({ userId, questId: RAFFLE_QUEST, completedOn: questDay(now) })
      .onConflictDoUpdate({
        target: [playerQuests.userId, playerQuests.questId],
        set: { completedOn: questDay(now) },
      });
    const outcome = drawRaffle();
    const coins = RAFFLE_COINS[outcome];
    if (coins > 0) {
      await transaction
        .update(playerWallets)
        .set({ coins: sql`${playerWallets.coins} + ${coins}`, updatedAt: new Date() })
        .where(eq(playerWallets.userId, userId));
    }
    await recordEvent(transaction, userId, 'quest.finished', {
      coinsAfter: await coinsNow(transaction, userId),
      questId: RAFFLE_QUEST,
      outcome,
      coins,
      boosterSetId: null,
    });
    return { hasDrawn: true, outcome, coins, wallet: await loadWallet(transaction, userId) };
  });
}
