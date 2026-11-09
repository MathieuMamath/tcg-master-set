// The day's quests done, and the daily bonus for doing six of them.

import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { playerQuests, playerWallets } from '@/db/schema';
import type { Wallet } from '@/game/cards/shop-dialogue';
import {
  canClaimDailyBonus,
  DAILY_BONUS_COINS,
  DAILY_BONUS_QUEST,
  type DailyActivity,
  dailyActivity,
} from '@/game/quests/activity';
import { questDay } from '@/game/quests/quests';
import { recordEvent } from './events';
import { coinsNow, loadWallet, type Reader } from './wallet';

// Every quest's last day at once, read into today's activity.
export async function loadDailyActivity(database: Reader, userId: string): Promise<DailyActivity> {
  const rows = await database
    .select({ questId: playerQuests.questId, completedOn: playerQuests.completedOn })
    .from(playerQuests)
    .where(eq(playerQuests.userId, userId));
  return dailyActivity(
    new Map(rows.map(({ questId, completedOn }) => [questId, completedOn])),
    new Date(),
  );
}

export function loadPlayerActivity(userId: string): Promise<DailyActivity> {
  return loadDailyActivity(getDb(), userId);
}

export type DailyBonusClaim = { isClaimed: boolean; activity: DailyActivity; wallet: Wallet };

// Pays the day's bonus once every daily quest is done. The bonus's row is locked and used up with
// the payment, so that it pays once a day.
export async function claimDailyBonus(userId: string): Promise<DailyBonusClaim> {
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    await loadWallet(transaction, userId);
    await transaction
      .select({ completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(and(eq(playerQuests.userId, userId), eq(playerQuests.questId, DAILY_BONUS_QUEST)))
      .for('update');
    const activity = await loadDailyActivity(transaction, userId);
    if (!canClaimDailyBonus(activity)) {
      return { isClaimed: false, activity, wallet: await loadWallet(transaction, userId) };
    }
    await transaction
      .insert(playerQuests)
      .values({ userId, questId: DAILY_BONUS_QUEST, completedOn: questDay(now) })
      .onConflictDoUpdate({
        target: [playerQuests.userId, playerQuests.questId],
        set: { completedOn: questDay(now) },
      });
    await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} + ${DAILY_BONUS_COINS}`, updatedAt: new Date() })
      .where(eq(playerWallets.userId, userId));
    await recordEvent(transaction, userId, 'daily_bonus.claimed', {
      coinsAfter: await coinsNow(transaction, userId),
      coins: DAILY_BONUS_COINS,
    });
    return {
      isClaimed: true,
      activity: { ...activity, isBonusClaimed: true },
      wallet: await loadWallet(transaction, userId),
    };
  });
}
