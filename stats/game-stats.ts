import { and, count, countDistinct, eq, gte, max, type SQL, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameEvents } from '@/db/schema';
import { GAME_EVENT_TYPES, type GameEventType } from '@/game/events';
import { type BucketUnit, periodStart, type StatsPeriod, statsBuckets } from '@/game/stats';

// The game's statistics, worked out from the event log on the server. Everything here counts and
// adds up across players: no player's id, name or email ever leaves this module.

export type CoinFlow = { source: string; coins: number };

export type SeriesPoint = {
  key: string;
  earned: number;
  spent: number;
  bought: number;
  opened: number;
  finished: number;
  active: number;
};

export type GameStats = {
  period: StatsPeriod;
  economy: { earned: CoinFlow[]; spent: CoinFlow[] };
  boosters: {
    bought: number;
    opened: number;
    godPacks: number;
    newCards: number;
    bySet: { setId: string; bought: number; opened: number }[];
    tiers: { tier: number; count: number }[];
  };
  quests: {
    questId: string;
    started: number;
    finished: number;
    rejected: number;
    outcomes: { outcome: string; count: number }[];
  }[];
  dailyBonuses: number;
  players: {
    signUps: number;
    signIns: number;
    active: number;
    places: { place: string; visits: number }[];
  };
  // The period in steps, for the charts: hours today, days, or weeks since the start.
  series: { unit: BucketUnit; points: SeriesPoint[] };
  // Every type of the catalogue, with how many in the period and when one was last recorded, so
  // that a type never seen stands out.
  events: { type: GameEventType; count: number; lastAt: string | null }[];
};

// The fields of the details that the statistics read. Written into the query itself, so that a
// grouped column and its selected twin are the same expression: they are the code's own names,
// never anything a player sent.
type DetailField =
  | 'questId'
  | 'coins'
  | 'setId'
  | 'quantity'
  | 'bestTier'
  | 'isGodPack'
  | 'newCards'
  | 'duplicateCoins'
  | 'outcome'
  | 'place';

const detail = (field: DetailField) => sql`${gameEvents.details}->>${sql.raw(`'${field}'`)}`;
const detailNumber = (field: DetailField) => sql<number>`coalesce(sum((${detail(field)})::int), 0)`;

export async function loadGameStats(period: StatsPeriod, now = new Date()): Promise<GameStats> {
  const database = getDb();
  const since = periodStart(period, now);
  const inPeriod = (...conditions: (SQL | undefined)[]) =>
    and(since ? gte(gameEvents.occurredAt, since) : undefined, ...conditions);
  const ofType = (type: GameEventType) => eq(gameEvents.type, type);

  const sumOf = async (type: GameEventType, field: DetailField) => {
    const [row] = await database
      .select({ total: detailNumber(field) })
      .from(gameEvents)
      .where(inPeriod(ofType(type)));
    return Number(row?.total ?? 0);
  };
  const countOf = async (type: GameEventType, condition?: SQL) => {
    const [row] = await database
      .select({ total: count() })
      .from(gameEvents)
      .where(inPeriod(ofType(type), condition));
    return Number(row?.total ?? 0);
  };

  // Coins earned, by where they came from, and spent, by what on.
  const questCoins = await database
    .select({ questId: detail('questId'), coins: detailNumber('coins') })
    .from(gameEvents)
    .where(inPeriod(ofType('quest.finished')))
    .groupBy(detail('questId'));
  const earned: CoinFlow[] = [
    ...questCoins.map(({ questId, coins }) => ({ source: String(questId), coins: Number(coins) })),
    { source: 'daily-bonus', coins: await sumOf('daily_bonus.claimed', 'coins') },
    { source: 'duplicates', coins: await sumOf('booster.opened', 'duplicateCoins') },
  ].filter(({ coins }) => coins > 0);
  const spent: CoinFlow[] = [
    { source: 'boosters', coins: await sumOf('booster.bought', 'coins') },
    { source: 'binders', coins: await sumOf('binder.bought', 'coins') },
  ];

  // Boosters bought and opened, set by set, and the best pull of each opened pack.
  const boughtBySet = await database
    .select({ setId: detail('setId'), total: detailNumber('quantity') })
    .from(gameEvents)
    .where(inPeriod(ofType('booster.bought')))
    .groupBy(detail('setId'));
  const openedBySet = await database
    .select({ setId: detail('setId'), total: count() })
    .from(gameEvents)
    .where(inPeriod(ofType('booster.opened')))
    .groupBy(detail('setId'));
  const setIds = [...new Set([...boughtBySet, ...openedBySet].map(({ setId }) => String(setId)))];
  const bySet = setIds
    .map((setId) => ({
      setId,
      bought: Number(boughtBySet.find((row) => String(row.setId) === setId)?.total ?? 0),
      opened: Number(openedBySet.find((row) => String(row.setId) === setId)?.total ?? 0),
    }))
    .sort((first, second) => second.bought + second.opened - (first.bought + first.opened));
  const tierRows = await database
    .select({ tier: detail('bestTier'), total: count() })
    .from(gameEvents)
    .where(inPeriod(ofType('booster.opened')))
    .groupBy(detail('bestTier'));

  // Each quest: attempts started, finished and refused, and how they ended.
  const questRows = await database
    .select({ type: gameEvents.type, questId: detail('questId'), total: count() })
    .from(gameEvents)
    .where(
      inPeriod(sql`${gameEvents.type} in ('quest.started', 'quest.finished', 'quest.rejected')`),
    )
    .groupBy(gameEvents.type, detail('questId'));
  const outcomeRows = await database
    .select({ questId: detail('questId'), outcome: detail('outcome'), total: count() })
    .from(gameEvents)
    .where(inPeriod(ofType('quest.finished')))
    .groupBy(detail('questId'), detail('outcome'));
  const questIds = [...new Set(questRows.map(({ questId }) => String(questId)))].sort();
  const questTotal = (type: GameEventType, questId: string) =>
    Number(
      questRows.find((row) => row.type === type && String(row.questId) === questId)?.total ?? 0,
    );
  const quests = questIds.map((questId) => ({
    questId,
    started: questTotal('quest.started', questId),
    finished: questTotal('quest.finished', questId),
    rejected: questTotal('quest.rejected', questId),
    outcomes: outcomeRows
      .filter((row) => String(row.questId) === questId)
      .map(({ outcome, total }) => ({ outcome: String(outcome), count: Number(total) }))
      .sort((first, second) => second.count - first.count),
  }));

  // Players: who joined, came back, played, and where they went. Counted, never named.
  const [active] = await database
    .select({ total: countDistinct(gameEvents.userId) })
    .from(gameEvents)
    .where(inPeriod());
  const placeRows = await database
    .select({ place: detail('place'), total: count() })
    .from(gameEvents)
    .where(inPeriod(ofType('place.entered')))
    .groupBy(detail('place'));
  // Everything charted over time, in one pass, step by step.
  const buckets = statsBuckets(period, now);
  const step = sql.raw(`'${buckets.unit}'`);
  const keyFormat = sql.raw(buckets.unit === 'hour' ? `'YYYY-MM-DD"T"HH24'` : `'YYYY-MM-DD'`);
  const coins = sql`(${detail('coins')})::int`;
  const seriesRows = await database
    .select({
      key: sql<string>`to_char(date_trunc(${step}, ${gameEvents.occurredAt} at time zone 'UTC'), ${keyFormat})`,
      earned: sql<number>`coalesce(sum(case
        when ${gameEvents.type} in ('quest.finished', 'daily_bonus.claimed') then ${coins}
        when ${gameEvents.type} = 'booster.opened' then (${detail('duplicateCoins')})::int
        else 0 end), 0)`,
      spent: sql<number>`coalesce(sum(case
        when ${gameEvents.type} in ('booster.bought', 'binder.bought') then ${coins}
        else 0 end), 0)`,
      bought: sql<number>`coalesce(sum(case
        when ${gameEvents.type} = 'booster.bought' then (${detail('quantity')})::int
        else 0 end), 0)`,
      opened: sql<number>`count(*) filter (where ${gameEvents.type} = 'booster.opened')`,
      finished: sql<number>`count(*) filter (where ${gameEvents.type} = 'quest.finished')`,
      active: countDistinct(gameEvents.userId),
    })
    .from(gameEvents)
    .where(gte(gameEvents.occurredAt, buckets.start))
    .groupBy(sql`1`);
  const points: SeriesPoint[] = buckets.keys.map((key) => {
    const row = seriesRows.find((candidate) => candidate.key === key);
    return {
      key,
      earned: Number(row?.earned ?? 0),
      spent: Number(row?.spent ?? 0),
      bought: Number(row?.bought ?? 0),
      opened: Number(row?.opened ?? 0),
      finished: Number(row?.finished ?? 0),
      active: Number(row?.active ?? 0),
    };
  });

  // The catalogue's coverage: how many of each type, and the last one ever recorded.
  const typeRows = await database
    .select({ type: gameEvents.type, total: count() })
    .from(gameEvents)
    .where(inPeriod())
    .groupBy(gameEvents.type);
  const lastRows = await database
    .select({ type: gameEvents.type, lastAt: max(gameEvents.occurredAt) })
    .from(gameEvents)
    .groupBy(gameEvents.type);

  return {
    period,
    economy: { earned, spent },
    boosters: {
      bought: bySet.reduce((total, { bought }) => total + bought, 0),
      opened: bySet.reduce((total, { opened }) => total + opened, 0),
      godPacks: await countOf('booster.opened', sql`${detail('isGodPack')} = 'true'`),
      newCards: await sumOf('booster.opened', 'newCards'),
      bySet,
      tiers: tierRows
        .map(({ tier, total }) => ({ tier: Number(tier), count: Number(total) }))
        .sort((first, second) => first.tier - second.tier),
    },
    quests,
    dailyBonuses: await countOf('daily_bonus.claimed'),
    players: {
      signUps: await countOf('player.signed_up'),
      signIns: await countOf('player.signed_in'),
      active: Number(active?.total ?? 0),
      places: placeRows
        .map(({ place, total }) => ({ place: String(place), visits: Number(total) }))
        .sort((first, second) => second.visits - first.visits),
    },
    series: { unit: buckets.unit, points },
    events: GAME_EVENT_TYPES.map((type) => {
      const last = lastRows.find((row) => row.type === type)?.lastAt;
      return {
        type,
        count: Number(typeRows.find((row) => row.type === type)?.total ?? 0),
        lastAt: last ? new Date(last).toISOString() : null,
      };
    }),
  };
}
