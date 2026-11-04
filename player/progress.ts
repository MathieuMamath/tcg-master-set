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
  canClaimDailyBonus,
  DAILY_BONUS_COINS,
  DAILY_BONUS_QUEST,
  type DailyActivity,
  dailyActivity,
} from '@/game/activity';
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
import {
  type CarvingStatus,
  canFinishDalgona,
  DALGONA_QUEST,
  type DalgonaShape,
  parsePresses,
  replayDalgona,
  SHAPE_COINS,
  shapeOf,
} from '@/game/dalgona';
import { duplicateCoins } from '@/game/duplicate-coins';
import { FISHING_QUEST, type FishedItem, fishItem, ITEM_COINS } from '@/game/fishing';
import {
  dealMemoryGame,
  flipMemoryCard,
  GRANDPA_QUEST,
  MEMORY_REWARD,
  type MemoryStatus,
} from '@/game/memory-game';
import {
  canFinishQuest,
  canStartQuest,
  GRANDMA_QUEST,
  QUEST_REWARD,
  questDay,
} from '@/game/quests';
import { drawRaffle, RAFFLE_COINS, RAFFLE_QUEST, type RaffleOutcome } from '@/game/raffle';
import {
  BINDER_PRICE,
  BOOSTER_PRICE,
  type ShopkeeperLine,
  STARTING_COINS,
  type Wallet,
} from '@/game/shop-dialogue';
import { type PlayerSpot, parseSpot } from '@/game/spot';
import { recordEvent } from './events';

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
  // The day Papy Caillou was last beaten at memory, after which he only shares sayings.
  memoryWonOn: string | null;
  // The day Léa's walls were last dusted, after which she can breathe again.
  cleanedOn: string | null;
  // The day of the last turn of Bérénice's drum, after which she says to come back tomorrow.
  raffleDrawnOn: string | null;
  // Today's quests done, for the activity tracker.
  activity: DailyActivity;
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

// The day a quest last paid its reward.
async function loadRewardDay(
  database: Reader,
  userId: string,
  questId: string,
): Promise<string | null> {
  const [attempt] = await database
    .select({ completedOn: playerQuests.completedOn })
    .from(playerQuests)
    .where(and(eq(playerQuests.userId, userId), eq(playerQuests.questId, questId)));
  return attempt?.completedOn ?? null;
}

// Every quest's last day at once, read into today's activity.
async function loadDailyActivity(database: Reader, userId: string): Promise<DailyActivity> {
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
    await recordEvent(transaction, userId, 'daily_bonus.claimed', { coins: DAILY_BONUS_COINS });
    return {
      isClaimed: true,
      activity: { ...activity, isBonusClaimed: true },
      wallet: await loadWallet(transaction, userId),
    };
  });
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
        facing: playerSpots.facing,
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
    basketballRewardedOn: await loadRewardDay(getDb(), userId, BASKETBALL_QUEST),
    memoryWonOn: await loadRewardDay(getDb(), userId, GRANDPA_QUEST),
    cleanedOn: await loadRewardDay(getDb(), userId, GRANDMA_QUEST),
    raffleDrawnOn: await loadRewardDay(getDb(), userId, RAFFLE_QUEST),
    activity: await loadDailyActivity(getDb(), userId),
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
    await recordEvent(transaction, userId, 'quest.started', { questId });
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
      if (attempt?.startedAt) {
        await recordEvent(transaction, userId, 'quest.rejected', { questId: GRANDMA_QUEST });
      }
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
    await recordEvent(transaction, userId, 'quest.finished', {
      questId: GRANDMA_QUEST,
      outcome: 'rewarded',
      coins: QUEST_REWARD,
      boosterSetId: null,
    });
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
      questId: GRANDPA_QUEST,
      outcome: 'won',
      coins: MEMORY_REWARD,
      boosterSetId: null,
      moves: game.moves,
    });
    return { ...answer, wallet: await loadWallet(transaction, userId) };
  });
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
      questId: RAFFLE_QUEST,
      outcome,
      coins,
      boosterSetId: null,
    });
    return { hasDrawn: true, outcome, coins, wallet: await loadWallet(transaction, userId) };
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
  item: FishedItem | null;
  boosterSetId: SetId | null;
  wallet: Wallet;
};

// The item is drawn here, in the transaction that uses up the attempt, so that it can't be drawn
// again. The treasure box pays in coins too if no set has been imported, since it has no booster
// to give.
export async function reelInItem(userId: string): Promise<FishingCatch> {
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
      questId: FISHING_QUEST,
      outcome: item === 'treasure' ? 'treasure' : 'item',
      coins: boosterSetId ? 0 : ITEM_COINS,
      boosterSetId,
      item,
    });
    return { item, boosterSetId, wallet: await loadWallet(transaction, userId) };
  });
}

// A save in another place than the last one means the player went there, through a door or by
// bus. A save in the same place, such as the one made when the page is left, records nothing.
export async function savePlayerSpot(userId: string, spot: PlayerSpot): Promise<void> {
  const { place, x, facing } = spot;
  await getDb().transaction(async (transaction) => {
    const [previous] = await transaction
      .select({ place: playerSpots.place })
      .from(playerSpots)
      .where(eq(playerSpots.userId, userId))
      .for('update');
    await transaction
      .insert(playerSpots)
      .values({ userId, place, x, facing })
      .onConflictDoUpdate({
        target: playerSpots.userId,
        set: { place, x, facing, updatedAt: new Date() },
      });
    if (previous?.place !== place) {
      await recordEvent(transaction, userId, 'place.entered', {
        place,
        from: previous?.place ?? null,
      });
    }
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
    await recordEvent(transaction, userId, 'booster.bought', { setId, quantity, coins: price });
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

    await recordEvent(transaction, userId, 'binder.bought', { setId, coins: BINDER_PRICE });
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
    const duplicateTotal = cards.reduce((total, { coins }) => total + coins, 0);
    await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} + ${duplicateTotal}`, updatedAt: new Date() })
      .where(eq(playerWallets.userId, userId));
    await recordEvent(transaction, userId, 'booster.opened', {
      setId,
      isGodPack: opened.isGodPack,
      bestTier: Math.max(0, ...cards.map(({ tier }) => tier)),
      newCards: cards.filter(({ isNew }) => isNew).length,
      duplicateCoins: duplicateTotal,
    });

    return {
      ...details,
      cards,
      isGodPack: opened.isGodPack,
      wallet: await loadWallet(transaction, userId),
    };
  });
}
