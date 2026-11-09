import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { cards, cardTranslations } from '@/db/schema';
import { PLAYABLE_SET_IDS } from '@/game/cards/card-sets';
import { MEMORY_PAIRS } from '@/game/quests/memory-game';

export type MemoryCard = { name: string; imageUrl: string | null };

// The pictures of the memory game, from the whole catalogue. Giving them all to the browser reveals
// nothing, since where they lie on the board stays on the server.
export async function pickMemoryCards(locale: string): Promise<MemoryCard[]> {
  return getDb()
    .select({ name: cardTranslations.name, imageUrl: cardTranslations.imageUrl })
    .from(cards)
    .innerJoin(cardTranslations, eq(cardTranslations.cardId, cards.id))
    .where(
      and(
        inArray(cards.setId, [...PLAYABLE_SET_IDS]),
        eq(cardTranslations.locale, locale),
        isNotNull(cardTranslations.imageUrl),
      ),
    )
    .orderBy(sql`random()`)
    .limit(MEMORY_PAIRS);
}
