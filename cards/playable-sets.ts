import { and, count, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { cardSets, cardSetTranslations, cards, cardVariants } from '@/db/schema';
import { PLAYABLE_SET_IDS, type PlayableSet } from '@/game/card-sets';

// Only the sets that have been imported, so that the game never offers an empty one.
export async function loadPlayableSets(locale: string): Promise<PlayableSet[]> {
  const db = getDb();
  const slotTotals = await db
    .select({ id: cards.setId, slotTotal: count() })
    .from(cardVariants)
    .innerJoin(cards, eq(cards.id, cardVariants.cardId))
    .where(inArray(cards.setId, [...PLAYABLE_SET_IDS]))
    .groupBy(cards.setId);
  const rows = await db
    .select({
      id: cardSetTranslations.setId,
      locale: cardSetTranslations.locale,
      name: cardSetTranslations.name,
      logoUrl: cardSetTranslations.logoUrl,
      releaseDate: cardSets.releaseDate,
    })
    .from(cardSetTranslations)
    .innerJoin(cardSets, eq(cardSets.id, cardSetTranslations.setId))
    .where(
      and(
        inArray(cardSetTranslations.locale, [locale, 'en']),
        inArray(cardSetTranslations.setId, [...PLAYABLE_SET_IDS]),
      ),
    );

  return PLAYABLE_SET_IDS.flatMap((id) => {
    const forSet = rows.filter((candidate) => candidate.id === id);
    // Many older sets never came out in every language, or have their logo in English only.
    const translated = forSet.find((candidate) => candidate.locale === locale);
    const row = translated ?? forSet[0];
    return row
      ? [
          {
            id,
            name: row.name,
            logoUrl: translated?.logoUrl ?? forSet.find(({ logoUrl }) => logoUrl)?.logoUrl ?? null,
            releaseDate: row.releaseDate,
            slotTotal: slotTotals.find((total) => total.id === id)?.slotTotal ?? 0,
          },
        ]
      : [];
  });
}
