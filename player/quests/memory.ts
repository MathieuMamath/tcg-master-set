// Papy Caillou's memory game, played card by card on the server.

import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { playerQuests, playerWallets } from '@/db/schema';
import type { Wallet } from '@/game/cards/shop-dialogue';
import {
  dealMemoryGame,
  flipMemoryCard,
  GRANDPA_QUEST,
  MEMORY_REWARD,
  type MemoryStatus,
} from '@/game/quests/memory-game';
import { canStartQuest, questDay } from '@/game/quests/quests';
import { recordEvent } from '../events';
import { coinsNow, loadWallet } from '../wallet';

// The board stays here: the browser only learns a card's face when it flips that card. Starting
// again replaces an attempt that was given up on, with a new board.
export async function startGrandpaQuest(userId: string): Promise<{ hasStarted: boolean }> {
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    const [attempt] = await transaction
      .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(and(eq(playerQuests.userId, userId), eq(playerQuests.questId, GRANDPA_QUEST)))
      .for('update');
    if (attempt && !canStartQuest(attempt, now)) {
      return { hasStarted: false };
    }
    const memoryGame = dealMemoryGame();
    await transaction
      .insert(playerQuests)
      .values({ userId, questId: GRANDPA_QUEST, startedAt: now, memoryGame })
      .onConflictDoUpdate({
        target: [playerQuests.userId, playerQuests.questId],
        set: { startedAt: now, memoryGame },
      });
    await recordEvent(transaction, userId, 'quest.started', { questId: GRANDPA_QUEST });
    return { hasStarted: true };
  });
}

export type MemoryFlipAnswer = {
  face: number;
  isMatch: boolean | null;
  moves: number;
  status: MemoryStatus;
  wallet: Wallet;
};

// Null when this card can't be flipped, or no game is under way. The row is locked, and the game
// is used up with the reward, so that it can only pay once.
export async function flipGrandpaCard(
  userId: string,
  position: unknown,
): Promise<MemoryFlipAnswer | null> {
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    const wallet = await loadWallet(transaction, userId);
    const quest = and(eq(playerQuests.userId, userId), eq(playerQuests.questId, GRANDPA_QUEST));
    const [attempt] = await transaction
      .select({ memoryGame: playerQuests.memoryGame })
      .from(playerQuests)
      .where(quest)
      .for('update');
    const flip = attempt?.memoryGame && flipMemoryCard(attempt.memoryGame, position);
    if (!flip) {
      return null;
    }

    const { game, face, isMatch, status } = flip;
    const answer = { face, isMatch, moves: game.moves, status, wallet };
    if (status === 'playing') {
      await transaction.update(playerQuests).set({ memoryGame: game }).where(quest);
      return answer;
    }
    if (status === 'lost') {
      await transaction
        .update(playerQuests)
        .set({ startedAt: null, memoryGame: null })
        .where(quest);
      await recordEvent(transaction, userId, 'quest.finished', {
        coinsAfter: await coinsNow(transaction, userId),
        questId: GRANDPA_QUEST,
        outcome: 'lost',
        coins: 0,
        boosterSetId: null,
        moves: game.moves,
      });
      return answer;
    }

    await transaction
      .update(playerQuests)
      .set({ startedAt: null, memoryGame: null, completedOn: questDay(now) })
      .where(quest);
    await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} + ${MEMORY_REWARD}`, updatedAt: new Date() })
      .where(eq(playerWallets.userId, userId));
    await recordEvent(transaction, userId, 'quest.finished', {
      coinsAfter: await coinsNow(transaction, userId),
      questId: GRANDPA_QUEST,
      outcome: 'won',
      coins: MEMORY_REWARD,
      boosterSetId: null,
      moves: game.moves,
    });
    return { ...answer, wallet: await loadWallet(transaction, userId) };
  });
}
