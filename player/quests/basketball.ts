// The arcade's basketball machine.

import { and, eq, sql } from 'drizzle-orm';
import { loadNewestSetId } from '@/cards/playable-sets';
import { getDb } from '@/db/client';
import { playerHighScores, playerQuests, playerWallets } from '@/db/schema';
import type { SetId } from '@/game/cards/card-sets';
import type { Wallet } from '@/game/cards/shop-dialogue';
import {
  BASKETBALL_COINS,
  BASKETBALL_GAME,
  BASKETBALL_QUEST,
  type BasketballReward,
  basketballReward,
  canFinishBasketball,
  scoreOfShots,
} from '@/game/quests/basketball';
import { canStartQuest, questDay } from '@/game/quests/quests';
import { recordEvent } from '../events';
import { addBooster, coinsNow, loadWallet, type Reader } from '../wallet';

export async function loadBasketballHighScore(database: Reader, userId: string): Promise<number> {
  const [best] = await database
    .select({ score: playerHighScores.score })
    .from(playerHighScores)
    .where(and(eq(playerHighScores.userId, userId), eq(playerHighScores.game, BASKETBALL_GAME)));
  return best?.score ?? 0;
}

// The machine can always be played for the high score, so this keeps the day of the last reward.
export async function startBasketball(userId: string): Promise<void> {
  await getDb().transaction(async (transaction) => {
    const startedAt = new Date();
    await transaction
      .insert(playerQuests)
      .values({ userId, questId: BASKETBALL_QUEST, startedAt })
      .onConflictDoUpdate({
        target: [playerQuests.userId, playerQuests.questId],
        set: { startedAt },
      });
    await recordEvent(transaction, userId, 'quest.started', { questId: BASKETBALL_QUEST });
  });
}

export type BasketballResult = {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  reward: BasketballReward;
  // The score earned a reward, but the day's reward was already paid.
  wasAlreadyPaid: boolean;
  boosterSetId: SetId | null;
  wallet: Wallet;
};

// Null when no game is under way, or when its shots can't have happened. The row is locked, and the
// game is used up with the reward, so that it can only pay once. A game that earns nothing leaves
// the day's reward to be won.
export async function finishBasketball(
  userId: string,
  shots: unknown,
): Promise<BasketballResult | null> {
  const latestSetId = await loadNewestSetId();

  return getDb().transaction(async (transaction) => {
    const now = new Date();
    await loadWallet(transaction, userId);
    const quest = and(eq(playerQuests.userId, userId), eq(playerQuests.questId, BASKETBALL_QUEST));
    const [attempt] = await transaction
      .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(quest)
      .for('update');
    const score = scoreOfShots(shots);
    if (!attempt?.startedAt || score === null || !canFinishBasketball(attempt.startedAt, now)) {
      if (attempt?.startedAt) {
        await recordEvent(transaction, userId, 'quest.rejected', { questId: BASKETBALL_QUEST });
      }
      return null;
    }

    const earned = basketballReward(score);
    const wasAlreadyPaid = earned !== 'none' && !canStartQuest(attempt, now);
    const reward = wasAlreadyPaid ? 'none' : earned;
    await transaction
      .update(playerQuests)
      .set({
        startedAt: null,
        ...(reward === 'none' ? {} : { completedOn: questDay(now) }),
      })
      .where(quest);

    const boosterSetId = reward === 'booster' ? latestSetId : null;
    if (boosterSetId) {
      await addBooster(transaction, userId, boosterSetId);
    } else if (reward !== 'none') {
      await transaction
        .update(playerWallets)
        .set({ coins: sql`${playerWallets.coins} + ${BASKETBALL_COINS}`, updatedAt: new Date() })
        .where(eq(playerWallets.userId, userId));
    }

    const previousBest = await loadBasketballHighScore(transaction, userId);
    const isNewHighScore = score > previousBest;
    if (isNewHighScore) {
      await transaction
        .insert(playerHighScores)
        .values({ userId, game: BASKETBALL_GAME, score })
        .onConflictDoUpdate({
          target: [playerHighScores.userId, playerHighScores.game],
          set: { score, updatedAt: new Date() },
        });
    }

    const paidReward = boosterSetId ? 'booster' : reward === 'none' ? 'none' : 'coins';
    await recordEvent(transaction, userId, 'quest.finished', {
      coinsAfter: await coinsNow(transaction, userId),
      questId: BASKETBALL_QUEST,
      outcome: wasAlreadyPaid ? 'alreadyPaid' : paidReward,
      coins: paidReward === 'coins' ? BASKETBALL_COINS : 0,
      boosterSetId,
      score,
    });
    return {
      score,
      highScore: Math.max(score, previousBest),
      isNewHighScore,
      reward: paidReward,
      wasAlreadyPaid,
      boosterSetId,
      wallet: await loadWallet(transaction, userId),
    };
  });
}
