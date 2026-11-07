import { BASKETBALL_QUEST } from './basketball';
import { DALGONA_QUEST } from './dalgona';
import { FISHING_QUEST } from './fishing';
import { GRANDPA_QUEST } from './memory-game';
import { GRANDMA_QUEST, questDay } from './quests';
import { RAFFLE_QUEST } from './raffle';
import { RAMEN_QUESTS } from './ramen';

// The day's quests, in the order the activity tracker lists them, each with who gives it. A quest
// counts as done once it is used up for the day: paid, or drawn for the raffle, won or not.
export const DAILY_QUESTS = [
  { id: GRANDMA_QUEST, giver: 'grandma' },
  { id: GRANDPA_QUEST, giver: 'grandpa' },
  { id: FISHING_QUEST, giver: 'boy' },
  { id: BASKETBALL_QUEST, giver: 'basketball' },
  { id: DALGONA_QUEST, giver: 'gaspard' },
  { id: RAFFLE_QUEST, giver: 'berenice' },
  // The ramen shop's three jobs, all given by its chef.
  { id: RAMEN_QUESTS.dishes, giver: 'ramenDishes' },
  { id: RAMEN_QUESTS.kitchen, giver: 'ramenKitchen' },
  { id: RAMEN_QUESTS.service, giver: 'ramenService' },
] as const;

export type DailyQuest = (typeof DAILY_QUESTS)[number];
export type DailyQuestId = DailyQuest['id'];
export type DailyQuestGiver = DailyQuest['giver'];

// Doing any six quests of the day earns a bonus, claimed from the tracker, and recorded under its
// own quest row so that it pays once a day. The others are extra: nobody has to play them all.
export const DAILY_BONUS_QUEST = 'daily-bonus';
export const DAILY_BONUS_COINS = 600;
export const DAILY_QUEST_GOAL = 6;

export type DailyActivity = {
  // The givers of the quests done today.
  done: DailyQuestGiver[];
  isBonusClaimed: boolean;
};

export function isDailyQuestId(id: string): id is DailyQuestId {
  return DAILY_QUESTS.some((quest) => quest.id === id);
}

// From the day each quest was last done, what today's tracker shows.
export function dailyActivity(
  completedOn: ReadonlyMap<string, string | null>,
  now: Date,
): DailyActivity {
  const today = questDay(now);
  return {
    done: DAILY_QUESTS.filter(({ id }) => completedOn.get(id) === today).map(({ giver }) => giver),
    isBonusClaimed: completedOn.get(DAILY_BONUS_QUEST) === today,
  };
}

export function canClaimDailyBonus({ done, isBonusClaimed }: DailyActivity): boolean {
  return !isBonusClaimed && done.length >= DAILY_QUEST_GOAL;
}
