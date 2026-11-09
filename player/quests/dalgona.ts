// Gaspard's dalgona.

import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { playerQuests, playerWallets } from '@/db/schema';
import type { Wallet } from '@/game/cards/shop-dialogue';
import {
  type CarvingStatus,
  canFinishDalgona,
  DALGONA_QUEST,
  type DalgonaShape,
  parsePresses,
  replayDalgona,
  SHAPE_COINS,
  shapeOf,
} from '@/game/quests/dalgona';
import { canStartQuest, questDay } from '@/game/quests/quests';
import { recordEvent } from '../events';
import { coinsNow, loadWallet } from '../wallet';

// Gaspard picks the shape from the moment the game starts, so the server can find it again on
// finishing. Starting again replaces a game that was given up on, or a biscuit that broke.
export async function startDalgona(
  userId: string,
): Promise<{ hasStarted: false } | { hasStarted: true; shape: DalgonaShape }> {
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    const quest = and(eq(playerQuests.userId, userId), eq(playerQuests.questId, DALGONA_QUEST));
    const [attempt] = await transaction
      .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(quest)
      .for('update');
    if (attempt && !canStartQuest(attempt, now)) {
      return { hasStarted: false };
    }
    await transaction
      .insert(playerQuests)
      .values({ userId, questId: DALGONA_QUEST, startedAt: now })
      .onConflictDoUpdate({
        target: [playerQuests.userId, playerQuests.questId],
        set: { startedAt: now },
      });
    await recordEvent(transaction, userId, 'quest.started', { questId: DALGONA_QUEST });
    return { hasStarted: true, shape: shapeOf(now) };
  });
}

export type DalgonaResult = {
  status: Exclude<CarvingStatus, 'carving'>;
  shape: DalgonaShape;
  coins: number;
  wallet: Wallet;
};

// Null when no game is under way, or when its presses can't have happened. The server replays the
// presses to know whether the shape came out whole. The row is locked, and the game is used up,
// so that it can only pay once.
export async function finishDalgona(
  userId: string,
  pressesSent: unknown,
): Promise<DalgonaResult | null> {
  const presses = parsePresses(pressesSent);
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    await loadWallet(transaction, userId);
    const quest = and(eq(playerQuests.userId, userId), eq(playerQuests.questId, DALGONA_QUEST));
    const [attempt] = await transaction
      .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(quest)
      .for('update');
    if (!attempt?.startedAt || !canStartQuest(attempt, now)) {
      return null;
    }
    const shape = shapeOf(attempt.startedAt);
    const carving = presses && replayDalgona(shape, presses);
    if (!carving || !canFinishDalgona(attempt.startedAt, now, carving.ms)) {
      await recordEvent(transaction, userId, 'quest.rejected', { questId: DALGONA_QUEST });
      return null;
    }

    const isCarved = carving.status === 'carved';
    await transaction
      .update(playerQuests)
      .set({ startedAt: null, ...(isCarved ? { completedOn: questDay(now) } : {}) })
      .where(quest);
    const coins = isCarved ? SHAPE_COINS[shape] : 0;
    if (coins > 0) {
      await transaction
        .update(playerWallets)
        .set({ coins: sql`${playerWallets.coins} + ${coins}`, updatedAt: new Date() })
        .where(eq(playerWallets.userId, userId));
    }
    await recordEvent(transaction, userId, 'quest.finished', {
      coinsAfter: await coinsNow(transaction, userId),
      questId: DALGONA_QUEST,
      outcome: isCarved ? 'carved' : 'broken',
      coins,
      boosterSetId: null,
      shape,
    });
    return {
      status: isCarved ? 'carved' : 'broken',
      shape,
      coins,
      wallet: await loadWallet(transaction, userId),
    };
  });
}
