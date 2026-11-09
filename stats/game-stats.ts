import { and, count, countDistinct, eq, gte, max, type SQL, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameEvents } from '@/db/schema';
import { GAME_EVENT_TYPES, type GameEventType } from '@/game/log/events';
import {
  type BalanceSummary,
  type BucketUnit,
  balanceSummary,
  periodStart,
  type StatsPeriod,
  statsBuckets,
} from '@/game/log/stats';

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
  // Coins earned and spent, and how rich the players are by the end of the period.
  economy: { earned: CoinFlow[]; spent: CoinFlow[]; balances: BalanceSummary };
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
    // Finished attempts by the stars they earned, for the quests that give stars.
    stars: { stars: number; count: number }[];
    // The average of the quest's own measure, for the quests that record one, such as the quiz's
    // right answers, the puzzle's moves or the hiding places searched for the kitten.
    averageScore: number | null;
  }[];
  dailyBonuses: number;
  players: {
    signUps: number;
    signIns: number;
    active: number;
    places: { place: string; visits: number }[];
    // Openings of the game's page, how long they lasted on average, in seconds, and on what and
    // from where: by device, by the domain of the link, null when typed in, and by language.
    visits: number;
    averageVisitSeconds: number | null;
    devices: { device: string; visits: number }[];
    referrers: { referrer: string | null; visits: number }[];
    locales: { locale: string; visits: number }[];
  };
  // How players play: conversations by character, shop windows looked through by seller and how
  // many purchases they led to, binders opened by set, boosters put back before being cut, and
  // nights slept.
  behaviour: {
    talks: { speaker: string; count: number }[];
    shopViews: { stock: string; count: number }[];
    purchases: number;
    binderViews: { setId: string; count: number }[];
    abandoned: number;
    sleeps: number;
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
  | 'stars'
  | 'score'
  | 'place'
  | 'device'
  | 'referrer'
  | 'locale'
  | 'seconds'
  | 'speaker'
  | 'stock';

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

  // Each player's coins after their last gain or spending in the period, only to be summed up.
  const latestBalances = await database.execute<{ coins: number }>(sql`
    select distinct on (${gameEvents.userId}) (${gameEvents.details}->>'coinsAfter')::int as coins
    from ${gameEvents}
    where ${gameEvents.details} ? 'coinsAfter'
      ${since ? sql`and ${gameEvents.occurredAt} >= ${since}` : sql``}
    order by ${gameEvents.userId}, ${gameEvents.occurredAt} desc`);
  const balances = balanceSummary(latestBalances.rows.map(({ coins }) => Number(coins)));

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
  const starRows = await database
    .select({ questId: detail('questId'), stars: detail('stars'), total: count() })
    .from(gameEvents)
    .where(inPeriod(ofType('quest.finished'), sql`${gameEvents.details} ? 'stars'`))
    .groupBy(detail('questId'), detail('stars'));
  const scoreRows = await database
    .select({
      questId: detail('questId'),
      average: sql<number>`avg((${detail('score')})::numeric)`,
    })
    .from(gameEvents)
    .where(inPeriod(ofType('quest.finished'), sql`${gameEvents.details} ? 'score'`))
    .groupBy(detail('questId'));
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
    stars: starRows
      .filter((row) => String(row.questId) === questId)
      .map(({ stars, total }) => ({ stars: Number(stars), count: Number(total) }))
      .sort((first, second) => first.stars - second.stars),
    averageScore: (() => {
      const row = scoreRows.find((score) => String(score.questId) === questId);
      return row ? Number(row.average) : null;
    })(),
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
  // Visits: how many, how long, and on what and from where.
  const visitsBy = async (field: DetailField) =>
    database
      .select({ value: detail(field), total: count() })
      .from(gameEvents)
      .where(inPeriod(ofType('game.opened')))
      .groupBy(detail(field));
  const [deviceRows, referrerRows, localeRows] = await Promise.all([
    visitsBy('device'),
    visitsBy('referrer'),
    visitsBy('locale'),
  ]);
  const [visitLength] = await database
    .select({ average: sql<number | null>`avg((${detail('seconds')})::int)` })
    .from(gameEvents)
    .where(inPeriod(ofType('game.left')));
  const byVisits = (first: { visits: number }, second: { visits: number }) =>
    second.visits - first.visits;

  // How players play.
  const countsBy = async (type: GameEventType, field: DetailField) =>
    (
      await database
        .select({ value: detail(field), total: count() })
        .from(gameEvents)
        .where(inPeriod(ofType(type)))
        .groupBy(detail(field))
    )
      .map(({ value, total }) => ({ value: String(value), count: Number(total) }))
      .sort((first, second) => second.count - first.count);
  const [talks, shopViews, binderViews] = await Promise.all([
    countsBy('npc.talked', 'speaker'),
    countsBy('shop.viewed', 'stock'),
    countsBy('binder.viewed', 'setId'),
  ]);

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
    economy: { earned, spent, balances },
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
      visits: await countOf('game.opened'),
      averageVisitSeconds:
        visitLength?.average === null || visitLength?.average === undefined
          ? null
          : Math.round(Number(visitLength.average)),
      devices: deviceRows
        .map(({ value, total }) => ({ device: String(value), visits: Number(total) }))
        .sort(byVisits),
      referrers: referrerRows
        .map(({ value, total }) => ({
          referrer: value === null ? null : String(value),
          visits: Number(total),
        }))
        .sort(byVisits),
      locales: localeRows
        .map(({ value, total }) => ({ locale: String(value), visits: Number(total) }))
        .sort(byVisits),
    },
    behaviour: {
      talks: talks.map(({ value, count: total }) => ({ speaker: value, count: total })),
      shopViews: shopViews.map(({ value, count: total }) => ({ stock: value, count: total })),
      purchases: (await countOf('booster.bought')) + (await countOf('binder.bought')),
      binderViews: binderViews.map(({ value, count: total }) => ({ setId: value, count: total })),
      abandoned: await countOf('booster.abandoned'),
      sleeps: await countOf('player.slept'),
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
