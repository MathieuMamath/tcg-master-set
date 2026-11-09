// The shifts, started with a seed and counted by replaying their presses.

import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { playerQuests, playerWallets } from '@/db/schema';
import type { Wallet } from '@/game/cards/shop-dialogue';
import { canStartQuest, questDay } from '@/game/quests/quests';
import {
  canFinishShift,
  playShift,
  SHIFT_QUESTS,
  type ShiftJob,
  shiftPayout,
  shiftSeed,
  shiftStars,
} from '@/game/quests/shifts/shifts';
import { recordEvent } from '../events';
import { coinsNow, loadWallet } from '../wallet';

// A shift at the ramen shop or the dojo begins: its moment is the seed of its orders, sent to the browser to
// show them. Starting again replaces a shift that was left halfway.
export async function startShift(userId: string, job: ShiftJob): Promise<{ seed: number }> {
  const questId = SHIFT_QUESTS[job];
  return getDb().transaction(async (transaction) => {
    const startedAt = new Date();
    await transaction
      .insert(playerQuests)
      .values({ userId, questId, startedAt })
      .onConflictDoUpdate({
        target: [playerQuests.userId, playerQuests.questId],
        set: { startedAt },
      });
    await recordEvent(transaction, userId, 'quest.started', { questId });
    return { seed: shiftSeed(startedAt) };
  });
}

export type ShiftOutcome = {
  score: number;
  mistakes: number;
  coins: number;
  // The shift earned coins, but the day's pay was already given.
  wasAlreadyPaid: boolean;
  // Nothing more can be earned today from this job.
  hasEarnedAll: boolean;
  wallet: Wallet;
};

// Null when no shift is under way, or when its presses can't have happened. The row is locked and
// the shift used up with its pay, so that it pays only what `shiftPayout` allows: once a day, or,
// for the jobs that top up, the difference a better shift earns. A shift that earns nothing
// leaves the day's pay to be won.
export async function finishShift(
  userId: string,
  job: ShiftJob,
  actions: unknown,
): Promise<ShiftOutcome | null> {
  const questId = SHIFT_QUESTS[job];
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    await loadWallet(transaction, userId);
    const quest = and(eq(playerQuests.userId, userId), eq(playerQuests.questId, questId));
    const [attempt] = await transaction
      .select({
        startedAt: playerQuests.startedAt,
        completedOn: playerQuests.completedOn,
        paidCoins: playerQuests.paidCoins,
      })
      .from(playerQuests)
      .where(quest)
      .for('update');
    const result = attempt?.startedAt
      ? playShift(job, shiftSeed(attempt.startedAt), actions)
      : null;
    if (
      !attempt?.startedAt ||
      !result ||
      !canFinishShift(attempt.startedAt, now, result.endedAtMs, job)
    ) {
      if (attempt?.startedAt) {
        await recordEvent(transaction, userId, 'quest.rejected', { questId });
      }
      return null;
    }

    const payout = shiftPayout(
      job,
      result.score,
      canStartQuest(attempt, now) ? null : attempt.paidCoins,
    );
    const { coins, wasAlreadyPaid } = payout;
    await transaction
      .update(playerQuests)
      .set({
        startedAt: null,
        ...(coins > 0 ? { completedOn: questDay(now), paidCoins: payout.paidToday } : {}),
      })
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
      outcome: wasAlreadyPaid ? 'alreadyPaid' : coins > 0 ? 'coins' : 'none',
      coins,
      boosterSetId: null,
      score: result.score,
      stars: shiftStars(job, result.score),
    });
    return {
      score: result.score,
      mistakes: result.mistakes,
      coins,
      wasAlreadyPaid,
      hasEarnedAll: payout.hasEarnedAll,
      wallet: await loadWallet(transaction, userId),
    };
  });
}
