// What every daily quest shares on the server: starting an attempt, and finishing one that was timed
// or scored, paying once a day.

import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { playerQuests, playerWallets } from '@/db/schema';
import type { Wallet } from '@/game/cards/shop-dialogue';
import { canStartQuest, type QuestAttempt, questDay } from '@/game/quests/quests';
import { recordEvent } from '../events';
import { coinsNow, loadWallet } from '../wallet';

// Starting again simply replaces an attempt that was given up on.
export async function startQuestAttempt(
  userId: string,
  questId: string,
): Promise<{ hasStarted: boolean }> {
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    const [attempt] = await transaction
      .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(and(eq(playerQuests.userId, userId), eq(playerQuests.questId, questId)))
      .for('update');
    if (attempt && !canStartQuest(attempt, now)) {
      return { hasStarted: false };
    }
    await transaction
      .insert(playerQuests)
      .values({ userId, questId, startedAt: now })
      .onConflictDoUpdate({
        target: [playerQuests.userId, playerQuests.questId],
        set: { startedAt: now },
      });
    await recordEvent(transaction, userId, 'quest.started', { questId });
    return { hasStarted: true };
  });
}

// The attempt's row is locked and used up with the reward, so that it can only pay once. For the
// quests played in the browser with a fixed reward, whose only check is the time it took.
export async function finishTimedQuest(
  userId: string,
  questId: string,
  coins: number,
  canFinish: (attempt: QuestAttempt, now: Date) => boolean,
): Promise<{ isRewarded: boolean; wallet: Wallet }> {
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    await loadWallet(transaction, userId);
    const quest = and(eq(playerQuests.userId, userId), eq(playerQuests.questId, questId));
    const [attempt] = await transaction
      .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(quest)
      .for('update');
    if (!attempt || !canFinish(attempt, now)) {
      if (attempt?.startedAt) {
        await recordEvent(transaction, userId, 'quest.rejected', { questId });
      }
      return { isRewarded: false, wallet: await loadWallet(transaction, userId) };
    }

    await transaction
      .update(playerQuests)
      .set({ startedAt: null, completedOn: questDay(now), paidCoins: coins })
      .where(quest);
    await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} + ${coins}`, updatedAt: new Date() })
      .where(eq(playerWallets.userId, userId));
    await recordEvent(transaction, userId, 'quest.finished', {
      coinsAfter: await coinsNow(transaction, userId),
      questId,
      outcome: 'rewarded',
      coins,
      boosterSetId: null,
    });
    return { isRewarded: true, wallet: await loadWallet(transaction, userId) };
  });
}

// A chore whose draw comes from the moment it began: starting it records that moment, and sends
// back what the browser needs to play it, drawn from it. Starting again replaces an attempt left
// halfway.
export async function startSeededChore<Drawn>(
  userId: string,
  questId: string,
  draw: (startedAt: Date) => Drawn,
): Promise<{ hasStarted: false } | ({ hasStarted: true } & Drawn)> {
  const started = await startQuestAttempt(userId, questId);
  const [attempt] = started.hasStarted
    ? await getDb()
        .select({ startedAt: playerQuests.startedAt })
        .from(playerQuests)
        .where(and(eq(playerQuests.userId, userId), eq(playerQuests.questId, questId)))
    : [];
  return attempt?.startedAt
    ? { hasStarted: true, ...draw(attempt.startedAt) }
    : { hasStarted: false };
}

// A chore scored on the server from what the browser sends, and paid once a day by its score: the
// attempt's row is locked and used up with the reward. `score` returns null for anything that
// can't be this attempt's play, and the call then returns null too.
export async function finishScoredChore<Checked>(
  userId: string,
  questId: string,
  score: (startedAt: Date, now: Date) => { checked: Checked; coins: number; points: number } | null,
): Promise<{ checked: Checked; coins: number; wallet: Wallet } | null> {
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    await loadWallet(transaction, userId);
    const quest = and(eq(playerQuests.userId, userId), eq(playerQuests.questId, questId));
    const [attempt] = await transaction
      .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(quest)
      .for('update');
    const scored =
      attempt?.startedAt && canStartQuest(attempt, now) ? score(attempt.startedAt, now) : null;
    if (!attempt || !scored) {
      if (attempt?.startedAt) {
        await recordEvent(transaction, userId, 'quest.rejected', { questId });
      }
      return null;
    }
    const { checked, coins, points } = scored;
    await transaction
      .update(playerQuests)
      .set({ startedAt: null, completedOn: questDay(now), paidCoins: coins })
      .where(quest);
    if (coins > 0) {
      await transaction
        .update(playerWallets)
        .set({ coins: sql`${playerWallets.coins} + ${coins}`, updatedAt: new Date() })
        .where(eq(playerWallets.userId, userId));
    }
    await recordEvent(transaction, userId, 'quest.finished', {
      coinsAfter: await coinsNow(transaction, userId),
      questId,
      outcome: coins > 0 ? 'rewarded' : 'none',
      coins,
      boosterSetId: null,
      score: points,
    });
    return { checked, coins, wallet: await loadWallet(transaction, userId) };
  });
}
