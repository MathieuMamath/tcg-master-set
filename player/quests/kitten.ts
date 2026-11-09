// Mme Ronron's lost kitten: her hint, and the searches of the hiding places.

import { and, count, eq, gte, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameEvents, playerQuests, playerWallets } from '@/db/schema';
import type { Wallet } from '@/game/cards/shop-dialogue';
import {
  canSearchKitten,
  isHidingSpot,
  KITTEN_QUEST,
  KITTEN_REWARD,
  kittenSpotFor,
} from '@/game/quests/lost-kitten';
import { canStartQuest, questDay } from '@/game/quests/quests';
import type { HidingSpotId } from '@/game/world/side-rooms';
import { recordEvent } from '../events';
import { coinsNow, loadWallet } from '../wallet';
import { startQuestAttempt } from './attempts';

// Mme Ronron gives her hint: the day's hiding place, the same all day. Asking again only restarts
// the short wait before a search can find the kitten.
export async function startKittenHunt(
  userId: string,
): Promise<{ hasStarted: false } | { hasStarted: true; spot: HidingSpotId }> {
  const started = await startQuestAttempt(userId, KITTEN_QUEST);
  return started.hasStarted
    ? { hasStarted: true, spot: kittenSpotFor(userId, questDay(new Date())) }
    : { hasStarted: false };
}

export type KittenSearch = { isFound: false } | { isFound: true; coins: number; wallet: Wallet };

// A hiding place searched. Only the day's one finds the kitten, and pays, once a day. Null when no
// hunt is under way, or the place isn't one.
export async function searchForKitten(userId: string, spot: unknown): Promise<KittenSearch | null> {
  if (!isHidingSpot(spot)) {
    return null;
  }
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    await loadWallet(transaction, userId);
    const quest = and(eq(playerQuests.userId, userId), eq(playerQuests.questId, KITTEN_QUEST));
    const [attempt] = await transaction
      .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(quest)
      .for('update');
    if (!attempt || !canStartQuest(attempt, now) || !canSearchKitten(attempt.startedAt, now)) {
      return null;
    }
    const isFound = spot === kittenSpotFor(userId, questDay(now));
    await recordEvent(transaction, userId, 'kitten.searched', { spot, isFound });
    if (!isFound) {
      return { isFound: false };
    }
    // How many hiding places were searched today to find him, this one included.
    const [searches] = await transaction
      .select({ total: count() })
      .from(gameEvents)
      .where(
        and(
          eq(gameEvents.userId, userId),
          eq(gameEvents.type, 'kitten.searched'),
          gte(gameEvents.occurredAt, new Date(`${questDay(now)}T00:00:00Z`)),
        ),
      );
    await transaction
      .update(playerQuests)
      .set({ startedAt: null, completedOn: questDay(now), paidCoins: KITTEN_REWARD })
      .where(quest);
    await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} + ${KITTEN_REWARD}`, updatedAt: new Date() })
      .where(eq(playerWallets.userId, userId));
    await recordEvent(transaction, userId, 'quest.finished', {
      coinsAfter: await coinsNow(transaction, userId),
      questId: KITTEN_QUEST,
      outcome: 'rewarded',
      coins: KITTEN_REWARD,
      boosterSetId: null,
      score: Number(searches?.total ?? 1),
    });
    return { isFound: true, coins: KITTEN_REWARD, wallet: await loadWallet(transaction, userId) };
  });
}
