import { describe, expect, test } from 'vitest';
import {
  canClaimDailyBonus,
  DAILY_BONUS_COINS,
  DAILY_BONUS_QUEST,
  DAILY_QUEST_GOAL,
  DAILY_QUESTS,
  dailyActivity,
} from './activity';

const NOW = new Date('2026-11-04T15:00:00Z');

function days(entries: Record<string, string | null>) {
  return new Map(Object.entries(entries));
}

describe('dailyActivity', () => {
  test('counts the quests done today, and only today', () => {
    const activity = dailyActivity(
      days({ [DAILY_QUESTS[0].id]: '2026-11-04', [DAILY_QUESTS[1].id]: '2026-11-03' }),
      NOW,
    );

    expect(activity).toEqual({ done: [DAILY_QUESTS[0].giver], isBonusClaimed: false });
  });

  test('knows when the bonus was claimed today', () => {
    expect(dailyActivity(days({ [DAILY_BONUS_QUEST]: '2026-11-04' }), NOW).isBonusClaimed).toBe(
      true,
    );
    expect(dailyActivity(days({ [DAILY_BONUS_QUEST]: '2026-11-03' }), NOW).isBonusClaimed).toBe(
      false,
    );
  });

  test('ignores rows that are not daily quests', () => {
    expect(dailyActivity(days({ 'some-old-quest': '2026-11-04' }), NOW).done).toEqual([]);
  });
});

describe('the daily bonus', () => {
  const everyQuest = days(Object.fromEntries(DAILY_QUESTS.map(({ id }) => [id, '2026-11-04'])));

  test('needs all six quests of the day, and pays 600 coins', () => {
    expect(DAILY_QUEST_GOAL).toBe(6);
    expect(DAILY_BONUS_COINS).toBe(600);
    expect(canClaimDailyBonus(dailyActivity(everyQuest, NOW))).toBe(true);
  });

  test('cannot be claimed with a quest left', () => {
    const fiveQuests = new Map(everyQuest);
    fiveQuests.delete(DAILY_QUESTS[3].id);

    expect(canClaimDailyBonus(dailyActivity(fiveQuests, NOW))).toBe(false);
  });

  test('cannot be claimed twice the same day', () => {
    const claimed = new Map(everyQuest).set(DAILY_BONUS_QUEST, '2026-11-04');

    expect(canClaimDailyBonus(dailyActivity(claimed, NOW))).toBe(false);
  });
});
