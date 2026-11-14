// A player's progress as the game page loads it, and the places and clock it saves.

import { and, eq } from 'drizzle-orm';
import { isAdmin } from '@/auth/roles';
import { getDb } from '@/db/client';
import { playerCards, playerClocks, playerQuests, playerSpots } from '@/db/schema';
import { type Collection, slotKey } from '@/game/cards/binder';
import type { SetId } from '@/game/cards/card-sets';
import type { Wallet } from '@/game/cards/shop-dialogue';
import type { DailyActivity } from '@/game/quests/activity';
import { BASKETBALL_QUEST } from '@/game/quests/basketball';
import { KITTEN_QUEST } from '@/game/quests/lost-kitten';
import { canStartQuest, GRANDMA_QUEST, questDay } from '@/game/quests/quests';
import { RAFFLE_QUEST } from '@/game/quests/raffle';
import type { PlayerSettings } from '@/game/ui/settings';
import { canSleep, isValidOffset, minuteOfDay, offsetAfterSleep } from '@/game/world/clock';
import { ADMIN_PLACES } from '@/game/world/side-rooms';
import { type PlayerSpot, parseSpot } from '@/game/world/spot';
import { loadDailyActivity } from './activity';
import { recordEvent } from './events';
import { loadBasketballHighScore } from './quests/basketball';
import { loadSettings } from './settings';
import { loadBinders, loadWallet, type Reader } from './wallet';

export type PlayerProgress = {
  wallet: Wallet;
  binders: SetId[];
  collection: Collection;
  spot: PlayerSpot | null;
  basketballHighScore: number;
  // The day of the last reward, so that the machine can say when it's already been paid.
  basketballRewardedOn: string | null;
  // The day Léa's walls were last dusted, after which she can breathe again.
  cleanedOn: string | null;
  // The day of the last turn of Bérénice's drum, after which she says to come back tomorrow.
  raffleDrawnOn: string | null;
  // Today's quests done, for the activity tracker.
  activity: DailyActivity;
  // Whether Mme Ronron gave her hint today and the kitten is still lost, so that the hiding places
  // can be searched.
  isKittenHunted: boolean;
  // Whether Brutus lets the player into the administrative office.
  isAdmin: boolean;
  // How far the player's sleeps moved the game's clock on, in game minutes.
  clockOffset: number;
  // The player's own preferences, from the settings menu.
  settings: PlayerSettings;
};

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

async function loadIsKittenHunted(database: Reader, userId: string): Promise<boolean> {
  const [attempt] = await database
    .select({ startedAt: playerQuests.startedAt, completedOn: playerQuests.completedOn })
    .from(playerQuests)
    .where(and(eq(playerQuests.userId, userId), eq(playerQuests.questId, KITTEN_QUEST)));
  const now = new Date();
  return (
    attempt?.startedAt != null &&
    questDay(attempt.startedAt) === questDay(now) &&
    canStartQuest(attempt, now)
  );
}

// A spot in the administrative office or its coupon floor is only for admins: anyone else starts
// in the bedroom.
async function allowedSpot(userId: string, spot: PlayerSpot | null): Promise<PlayerSpot | null> {
  return spot && ADMIN_PLACES.has(spot.place) && !(await isAdmin(userId)) ? null : spot;
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
    spot: await allowedSpot(userId, parseSpot(spots[0])),
    basketballHighScore: await loadBasketballHighScore(getDb(), userId),
    basketballRewardedOn: await loadRewardDay(getDb(), userId, BASKETBALL_QUEST),
    cleanedOn: await loadRewardDay(getDb(), userId, GRANDMA_QUEST),
    raffleDrawnOn: await loadRewardDay(getDb(), userId, RAFFLE_QUEST),
    activity: await loadDailyActivity(getDb(), userId),
    isKittenHunted: await loadIsKittenHunted(getDb(), userId),
    isAdmin: await isAdmin(userId),
    clockOffset: await loadClockOffset(getDb(), userId),
    settings: await loadSettings(getDb(), userId),
  };
}

async function loadClockOffset(database: Reader, userId: string): Promise<number> {
  const [row] = await database
    .select({ offset: playerClocks.offset })
    .from(playerClocks)
    .where(eq(playerClocks.userId, userId));
  return isValidOffset(row?.offset) ? row.offset : 0;
}

// Going to bed at night moves the player's clock on to the morning. Only at night: by day Pip
// isn't sleepy. Returns the new offset, or null when it isn't bedtime.
export async function sleepUntilMorning(userId: string, now = new Date()): Promise<number | null> {
  return getDb().transaction(async (transaction) => {
    const [row] = await transaction
      .select({ offset: playerClocks.offset })
      .from(playerClocks)
      .where(eq(playerClocks.userId, userId))
      .for('update');
    const offset = isValidOffset(row?.offset) ? row.offset : 0;
    if (!canSleep(minuteOfDay(now, offset))) {
      return null;
    }
    const slept = offsetAfterSleep(now, offset);
    await recordEvent(transaction, userId, 'player.slept', { minute: minuteOfDay(now, offset) });
    await transaction
      .insert(playerClocks)
      .values({ userId, offset: slept })
      .onConflictDoUpdate({
        target: playerClocks.userId,
        set: { offset: slept, updatedAt: now },
      });
    return slept;
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
