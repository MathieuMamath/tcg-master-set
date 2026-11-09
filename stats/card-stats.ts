import { and, count, eq, sql } from 'drizzle-orm';
import { loadBinderCatalogue } from '@/cards/binder-catalogue';
import { loadBoosterPool } from '@/cards/booster-pool';
import { getDb } from '@/db/client';
import { gameEvents } from '@/db/schema';
import { slotKey } from '@/game/cards/binder';
import { boosterRecipe, expectedPulls } from '@/game/cards/booster';
import { PLAYABLE_SET_IDS } from '@/game/cards/card-sets';
import {
  type CardDrop,
  type CardPulls,
  type CardStatsRow,
  cardDrops,
  dropRate,
} from '@/game/cards/card-stats';

// The draws of the boosters, card by card, worked out from the event log on the server. Only
// openings that recorded their cards count, and nothing about who opened them leaves this module.

export type SetDropOverview = { setId: string; boosters: number; versionsPulled: number };

export type SetDrops = { setName: string; boosters: number; drops: CardDrop[] };

const OPENED = 'booster.opened';
const hasCards = sql`${gameEvents.details} ? 'cards'`;
const setOf = sql`${gameEvents.details}->>'setId'`;

// For each set: how many boosters recorded their cards, and how many versions ever came out.
export async function loadSetDropOverview(): Promise<SetDropOverview[]> {
  const database = getDb();
  const boosters = await database
    .select({ setId: setOf, total: count() })
    .from(gameEvents)
    .where(and(eq(gameEvents.type, OPENED), hasCards))
    .groupBy(setOf);
  const versions = await database.execute<{ set_id: string; total: number }>(sql`
    select ${setOf} as set_id,
      count(distinct (card->>'cardId') || ':' || (card->>'variant'))::int as total
    from ${gameEvents}, jsonb_array_elements(${gameEvents.details}->'cards') as card
    where ${gameEvents.type} = ${OPENED}
    group by 1`);
  return boosters.map(({ setId, total }) => ({
    setId: String(setId),
    boosters: Number(total),
    versionsPulled: Number(versions.rows.find((row) => row.set_id === setId)?.total ?? 0),
  }));
}

// Every version of a set's cards, with how many times it came out and its rate per booster.
export async function loadSetDrops(setId: string, locale: string): Promise<SetDrops> {
  const database = getDb();
  const [catalogue, [opened], pulls] = await Promise.all([
    loadBinderCatalogue(setId, locale),
    database
      .select({ total: count() })
      .from(gameEvents)
      .where(and(eq(gameEvents.type, OPENED), hasCards, sql`${setOf} = ${setId}`)),
    database.execute<{ card_id: string; variant: string; pulls: number }>(sql`
      select card->>'cardId' as card_id, card->>'variant' as variant, count(*)::int as pulls
      from ${gameEvents}, jsonb_array_elements(${gameEvents.details}->'cards') as card
      where ${gameEvents.type} = ${OPENED} and ${setOf} = ${setId}
      group by 1, 2`),
  ]);
  const boosters = Number(opened?.total ?? 0);
  const rows: CardPulls[] = pulls.rows.map((row) => ({
    cardId: row.card_id,
    variant: row.variant,
    pulls: Number(row.pulls),
  }));
  return {
    setName: catalogue.setName,
    boosters,
    drops: cardDrops(catalogue.cards, rows, boosters),
  };
}

// Every version of every imported set, with how often it came out and how often its recipe says it
// should, for the full export Bastien hands over. Only aggregates, like the rest of this module.
export async function loadCardStatsRows(locale: string): Promise<CardStatsRow[]> {
  const database = getDb();
  const [boosters, pulls] = await Promise.all([
    database.execute<{ set_id: string; boosters: number; god_packs: number }>(sql`
      select ${setOf} as set_id, count(*)::int as boosters,
        count(*) filter (where (${gameEvents.details}->>'isGodPack')::boolean)::int as god_packs
      from ${gameEvents}
      where ${gameEvents.type} = ${OPENED} and ${hasCards}
      group by 1`),
    database.execute<{ set_id: string; card_id: string; variant: string; pulls: number }>(sql`
      select ${setOf} as set_id, card->>'cardId' as card_id, card->>'variant' as variant,
        count(*)::int as pulls
      from ${gameEvents}, jsonb_array_elements(${gameEvents.details}->'cards') as card
      where ${gameEvents.type} = ${OPENED}
      group by 1, 2, 3`),
  ]);
  const pulled = new Map(
    pulls.rows.map((row) => [
      `${row.set_id}|${slotKey(row.card_id, row.variant)}`,
      Number(row.pulls),
    ]),
  );
  const rows: CardStatsRow[] = [];
  for (const setId of PLAYABLE_SET_IDS) {
    const pool = await loadBoosterPool(setId);
    if (pool.length === 0) {
      continue;
    }
    const catalogue = await loadBinderCatalogue(setId, locale);
    const expected = expectedPulls(pool, boosterRecipe(setId, pool));
    const opened = boosters.rows.find((row) => row.set_id === setId);
    const setBoosters = Number(opened?.boosters ?? 0);
    const rarities = new Map(pool.map((card) => [card.id, card.rarity]));
    for (const { key, card, variant } of cardDrops(catalogue.cards, [], 0)) {
      const count = pulled.get(`${setId}|${key}`) ?? 0;
      rows.push({
        setId,
        setName: catalogue.setName,
        boosters: setBoosters,
        godPacks: Number(opened?.god_packs ?? 0),
        cardId: card.id,
        number: card.localId,
        name: card.name,
        rarity: rarities.get(card.id) ?? null,
        variant,
        pulls: count,
        observed: dropRate(count, setBoosters),
        expected: expected.get(key) ?? null,
      });
    }
  }
  return rows;
}
