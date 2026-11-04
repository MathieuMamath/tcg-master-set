import { and, eq, gt, gte, sql } from 'drizzle-orm';
import { loadBoosterPool, loadOpenedCards, type RevealedCard } from '@/cards/booster-pool';
import { loadLatestSoldSetId } from '@/cards/playable-sets';
import { getDb } from '@/db/client';
import {
  playerBinders,
  playerBoosters,
  playerCards,
  playerHighScores,
  playerQuests,
  playerSpots,
  playerWallets,
} from '@/db/schema';
import {
  BASKETBALL_COINS,
  BASKETBALL_GAME,
  BASKETBALL_QUEST,
  type BasketballReward,
  basketballReward,
  canFinishBasketball,
  scoreOfShots,
} from '@/game/basketball';
import { type Collection, firstCopies, slotKey } from '@/game/binder';
import { boosterRecipe, openBooster } from '@/game/booster';
import { isPlayableSet, type SetId } from '@/game/card-sets';
import { duplicateCoins } from '@/game/duplicate-coins';
import { catchFish, FISH_COINS, FISHING_QUEST, type Fish } from '@/game/fishing';
import {
  dealMemoryGame,
  flipMemoryCard,
  GRANDPA_QUEST,
  MEMORY_REWARD,
  type MemoryStatus,
} from '@/game/memory-game';
import { type PlayerSpot, parseSpot } from '@/game/places';
import {
  canFinishQuest,
  canStartQuest,
  GRANDMA_QUEST,
  QUEST_REWARD,
  questDay,
} from '@/game/quests';
import {
  BINDER_PRICE,
  BOOSTER_PRICE,
  type ShopkeeperLine,
  STARTING_COINS,
  type Wallet,
} from '@/game/shop-dialogue';

// Either the database itself or a transaction of it.
type Database = ReturnType<typeof getDb>;
type Reader = Pick<Database, 'select' | 'insert'>;

export type PlayerProgress = {
  wallet: Wallet;
  binders: SetId[];
  collection: Collection;
  spot: PlayerSpot | null;
  basketballHighScore: number;
  // The day of the last reward, so that the machine can say when it's already been paid.
  basketballRewardedOn: string | null;
};

export type OpenedBooster = {
  setName: string;
  logoUrl: string | null;
  cards: RevealedCard[];
  isGodPack: boolean;
  wallet: Wallet;
};

// A new player's wallet is created on first need, whatever the first request is.
async function loadWallet(database: Reader, userId: string): Promise<Wallet> {
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

async function loadBasketballHighScore(database: Reader, userId: string): Promise<number> {
  const [best] = await database
    .select({ score: playerHighScores.score })
    .from(playerHighScores)
    .where(and(eq(playerHighScores.userId, userId), eq(playerHighScores.game, BASKETBALL_GAME)));
  return best?.score ?? 0;
}

async function loadBasketballRewardDay(database: Reader, userId: string): Promise<string | null> {
  const [attempt] = await database
    .select({ completedOn: playerQuests.completedOn })
    .from(playerQuests)
    .where(and(eq(playerQuests.userId, userId), eq(playerQuests.questId, BASKETBALL_QUEST)));
  return attempt?.completedOn ?? null;
}

async function loadBinders(database: Reader, userId: string): Promise<SetId[]> {
  const binders = await database
    .select({ setId: playerBinders.setId })
    .from(playerBinders)
    .where(eq(playerBinders.userId, userId));
  return binders.flatMap(({ setId }) => (isPlayableSet(setId) ? [setId] : []));
}

export async function loadPlayerProgress(userId: string): Promise<PlayerProgress> {
  const db = getDb();
  const [wallet, binders, cards, spots] = await Promise.all([
    loadWallet(db, userId),
    loadBinders(db, userId),
    db
      .select({
        cardId: playerCards.cardId,
        variant: playerCards.variant,
        count: playerCards.count,
      })
      .from(playerCards)
      .where(eq(playerCards.userId, userId)),
    db
      .select({
        place: playerSpots.place,
        x: playerSpots.x,
        z: playerSpots.z,
        heading: playerSpots.heading,
      })
      .from(playerSpots)
      .where(eq(playerSpots.userId, userId)),
  ]);

  return {
    wallet,
    binders,
    collection: Object.fromEntries(
      cards.map(({ cardId, variant, count }) => [slotKey(cardId, variant), count]),
    ),
    spot: parseSpot(spots[0]),
    basketballHighScore: await loadBasketballHighScore(getDb(), userId),
    basketballRewardedOn: await loadBasketballRewardDay(getDb(), userId),
  };
}

// Starting again simply replaces an attempt that was given up on.
async function startQuestAttempt(
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
    return { hasStarted: true };
  });
}

export function startGrandmaQuest(userId: string): Promise<{ hasStarted: boolean }> {
  return startQuestAttempt(userId, GRANDMA_QUEST);
}

export function startFishingQuest(userId: string): Promise<{ hasStarted: boolean }> {
  return startQuestAttempt(userId, FISHING_QUEST);
}

// The attempt's row is locked and used up with the reward, so that it can only pay once.
export async function finishGrandmaQuest(
  userId: string,
): Promise<{ isRewarded: boolean; wallet: Wallet }> {
  return getDb().transaction(async (transaction) => {
    const now = new Date();
    await loadWallet(transaction, userId);
    const [attempt] = await transaction
      .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
      .from(playerQuests)
      .where(and(eq(playerQuests.userId, userId), eq(playerQuests.questId, GRANDMA_QUEST)))
      .for('update');
    if (!attempt || !canFinishQuest(attempt, now)) {
      return { isRewarded: false, wallet: await loadWallet(transaction, userId) };
    }

    await transaction
      .update(playerQuests)
      .set({ startedAt: null, completedOn: questDay(now) })
      .where(and(eq(playerQuests.userId, userId), eq(playerQuests.questId, GRANDMA_QUEST)));
    await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} + ${QUEST_REWARD}`, updatedAt: new Date() })
      .where(eq(playerWallets.userId, userId));
    return { isRewarded: true, wallet: await loadWallet(transaction, userId) };
  });
}

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
    return { ...answer, wallet: await loadWallet(transaction, userId) };
  });
}

// The machine can always be played for the high score, so this keeps the day of the last reward.
export async function startBasketball(userId: string): Promise<void> {
  const startedAt = new Date();
  await getDb()
    .insert(playerQuests)
    .values({ userId, questId: BASKETBALL_QUEST, startedAt })
    .onConflictDoUpdate({
      target: [playerQuests.userId, playerQuests.questId],
      set: { startedAt },
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
  const latestSetId = await loadLatestSoldSetId();

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

    return {
      score,
      highScore: Math.max(score, previousBest),
      isNewHighScore,
      reward: boosterSetId ? 'booster' : reward === 'none' ? 'none' : 'coins',
      wasAlreadyPaid,
      boosterSetId,
      wallet: await loadWallet(transaction, userId),
    };
  });
}

async function addBooster(database: Pick<Database, 'insert'>, userId: string, setId: SetId) {
  await database
    .insert(playerBoosters)
    .values({ userId, setId, count: 1 })
    .onConflictDoUpdate({
      target: [playerBoosters.userId, playerBoosters.setId],
      set: { count: sql`${playerBoosters.count} + 1` },
    });
}

export type FishingCatch = {
  // Null when no attempt is under way.
  fish: Fish | null;
  boosterSetId: SetId | null;
  wallet: Wallet;
};

// The fish is drawn here, in the transaction that uses up the attempt, so that it can't be drawn
// again. A shiny pays in coins too if no set has been imported, since it has no booster to give.
export async function reelInFish(userId: string): Promise<FishingCatch> {
  const latestSetId = await loadLatestSoldSetId();

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
      return { fish: null, boosterSetId: null, wallet: await loadWallet(transaction, userId) };
    }

    await transaction
      .update(playerQuests)
      .set({ startedAt: null, completedOn: questDay(now) })
      .where(quest);
    const fish = catchFish();
    const boosterSetId = fish === 'shiny' ? latestSetId : null;
    if (boosterSetId) {
      await addBooster(transaction, userId, boosterSetId);
    } else {
      await transaction
        .update(playerWallets)
        .set({ coins: sql`${playerWallets.coins} + ${FISH_COINS}`, updatedAt: new Date() })
        .where(eq(playerWallets.userId, userId));
    }
    return { fish, boosterSetId, wallet: await loadWallet(transaction, userId) };
  });
}

export async function savePlayerSpot(userId: string, spot: PlayerSpot): Promise<void> {
  const { place, x, z, heading } = spot;
  await getDb()
    .insert(playerSpots)
    .values({ userId, place, x, z, heading })
    .onConflictDoUpdate({
      target: playerSpots.userId,
      set: { place, x, z, heading, updatedAt: new Date() },
    });
}

// A set's boosters need its binder first. The coins and the booster change together, or not at all. The coins are only taken if they are
// there, so that two purchases at once can never go below zero.
// Several boosters of a set are paid for and added together, or not at all.
export async function buyBooster(
  userId: string,
  setId: SetId,
  quantity = 1,
): Promise<{ wallet: Wallet; line: ShopkeeperLine }> {
  const price = BOOSTER_PRICE * quantity;
  return getDb().transaction(async (transaction) => {
    await loadWallet(transaction, userId);
    const [binder] = await transaction
      .select({ setId: playerBinders.setId })
      .from(playerBinders)
      .where(and(eq(playerBinders.userId, userId), eq(playerBinders.setId, setId)));
    if (!binder) {
      return { wallet: await loadWallet(transaction, userId), line: 'needsBinder' as const };
    }

    const [paid] = await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} - ${price}`, updatedAt: new Date() })
      .where(and(eq(playerWallets.userId, userId), gte(playerWallets.coins, price)))
      .returning({ coins: playerWallets.coins });
    if (!paid) {
      return { wallet: await loadWallet(transaction, userId), line: 'notEnoughCoins' as const };
    }

    await transaction
      .insert(playerBoosters)
      .values({ userId, setId, count: quantity })
      .onConflictDoUpdate({
        target: [playerBoosters.userId, playerBoosters.setId],
        set: { count: sql`${playerBoosters.count} + ${quantity}` },
      });
    return { wallet: await loadWallet(transaction, userId), line: 'thanks' as const };
  });
}

// The binder is added first, so that of two purchases at once only one goes on to pay.
export async function buyBinder(
  userId: string,
  setId: SetId,
): Promise<{ wallet: Wallet; binders: SetId[]; line: ShopkeeperLine }> {
  return getDb().transaction(async (transaction) => {
    await loadWallet(transaction, userId);
    const result = async (line: ShopkeeperLine) => ({
      wallet: await loadWallet(transaction, userId),
      binders: await loadBinders(transaction, userId),
      line,
    });

    const [added] = await transaction
      .insert(playerBinders)
      .values({ userId, setId })
      .onConflictDoNothing()
      .returning({ setId: playerBinders.setId });
    if (!added) {
      return result('alreadyOwned');
    }

    const [paid] = await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} - ${BINDER_PRICE}`, updatedAt: new Date() })
      .where(and(eq(playerWallets.userId, userId), gte(playerWallets.coins, BINDER_PRICE)))
      .returning({ coins: playerWallets.coins });
    if (!paid) {
      await transaction
        .delete(playerBinders)
        .where(and(eq(playerBinders.userId, userId), eq(playerBinders.setId, setId)));
      return result('notEnoughCoins');
    }

    return result('thanks');
  });
}

// Returns null when the player has no booster of this set. Everything that can fail on reading
// the catalogue happens first, so that a failure never costs a booster.
export async function openOwnedBooster(
  userId: string,
  setId: SetId,
  locale: string,
): Promise<OpenedBooster | null> {
  const pool = await loadBoosterPool(setId);
  const opened = openBooster(pool, boosterRecipe(setId, pool));
  if (!opened) {
    throw new Error(`Set ${setId} can't fill a booster`);
  }
  const details = await loadOpenedCards(opened.cards, setId, locale);

  return getDb().transaction(async (transaction) => {
    const [taken] = await transaction
      .update(playerBoosters)
      .set({ count: sql`${playerBoosters.count} - 1` })
      .where(
        and(
          eq(playerBoosters.userId, userId),
          eq(playerBoosters.setId, setId),
          gt(playerBoosters.count, 0),
        ),
      )
      .returning({ count: playerBoosters.count });
    if (!taken) {
      return null;
    }

    const added = await transaction
      .insert(playerCards)
      .values(opened.cards.map(({ cardId, variant }) => ({ userId, cardId, variant, count: 1 })))
      .onConflictDoUpdate({
        target: [playerCards.userId, playerCards.cardId, playerCards.variant],
        set: { count: sql`${playerCards.count} + 1` },
      })
      .returning({
        cardId: playerCards.cardId,
        variant: playerCards.variant,
        count: playerCards.count,
      });
    const firsts = firstCopies(added);
    const rarities = new Map(pool.map(({ id, rarity }) => [id, rarity]));
    const cards = details.cards.map((card) => {
      const isNew = firsts.has(slotKey(card.id, card.variant));
      return { ...card, isNew, coins: isNew ? 0 : duplicateCoins(rarities.get(card.id) ?? null) };
    });

    // In the same transaction, so that the coins can't be lost or earned twice.
    await transaction
      .update(playerWallets)
      .set({
        coins: sql`${playerWallets.coins} + ${cards.reduce((total, { coins }) => total + coins, 0)}`,
        updatedAt: new Date(),
      })
      .where(eq(playerWallets.userId, userId));

    return {
      ...details,
      cards,
      isGodPack: opened.isGodPack,
      wallet: await loadWallet(transaction, userId),
    };
  });
}
