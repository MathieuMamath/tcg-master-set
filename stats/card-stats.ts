import { and, count, eq, sql } from 'drizzle-orm';
import { loadBinderCatalogue } from '@/cards/binder-catalogue';
import { getDb } from '@/db/client';
import { gameEvents } from '@/db/schema';
import { type CardDrop, type CardPulls, cardDrops } from '@/game/card-stats';

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
