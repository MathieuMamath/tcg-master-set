// Lucas's fishing at the park's lake.

import { and, eq, sql } from 'drizzle-orm';
import { loadNewestSetId } from '@/cards/playable-sets';
import { getDb } from '@/db/client';
import { playerQuests, playerWallets } from '@/db/schema';
import type { SetId } from '@/game/cards/card-sets';
import type { Wallet } from '@/game/cards/shop-dialogue';
import { FISHING_QUEST, type FishedItem, fishItem, ITEM_COINS } from '@/game/quests/fishing';
import { canStartQuest, questDay } from '@/game/quests/quests';
import { recordEvent } from '../events';
import { addBooster, coinsNow, loadWallet } from '../wallet';
import { startQuestAttempt } from './attempts';

export function startFishingQuest(userId: string): Promise<{ hasStarted: boolean }> {
  return startQuestAttempt(userId, FISHING_QUEST);
}

export type FishingCatch = {
  // Null when no attempt is under way.
  item: FishedItem | null;
  boosterSetId: SetId | null;
  wallet: Wallet;
};

// The item is drawn here, in the transaction that uses up the attempt, so that it can't be drawn
// again. The treasure box pays in coins too if no set has been imported, since it has no booster
// to give.
export async function reelInItem(userId: string): Promise<FishingCatch> {
  const latestSetId = await loadNewestSetId();

  return getDb().transaction(async (transaction) => {
    const now = new Date();
    await loadWallet(transaction, userId);
    const quest = and(eq(playerQuests.userId, userId), eq(playerQuests.questId, FISHING_QUEST));
    const [attempt] = await transaction
      .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(quest)
      .for('update');
    if (!attempt?.startedAt || !canStartQuest(attempt, now)) {
      return { item: null, boosterSetId: null, wallet: await loadWallet(transaction, userId) };
    }

    await transaction
      .update(playerQuests)
      .set({ startedAt: null, completedOn: questDay(now) })
      .where(quest);
    const item = fishItem();
    const boosterSetId = item === 'treasure' ? latestSetId : null;
    if (boosterSetId) {
      await addBooster(transaction, userId, boosterSetId);
    } else {
      await transaction
        .update(playerWallets)
        .set({ coins: sql`${playerWallets.coins} + ${ITEM_COINS}`, updatedAt: new Date() })
        .where(eq(playerWallets.userId, userId));
    }
    await recordEvent(transaction, userId, 'quest.finished', {
      coinsAfter: await coinsNow(transaction, userId),
      questId: FISHING_QUEST,
      outcome: item === 'treasure' ? 'treasure' : 'item',
      coins: boosterSetId ? 0 : ITEM_COINS,
      boosterSetId,
      item,
    });
    return { item, boosterSetId, wallet: await loadWallet(transaction, userId) };
  });
}
