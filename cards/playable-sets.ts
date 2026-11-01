import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { cardSetTranslations } from '@/db/schema';
import { isPlayableSet, PLAYABLE_SET_IDS, type PlayableSet } from '@/game/card-sets';

// Only the sets that have been imported, so that the game never offers an empty one.
export async function loadPlayableSets(locale: string): Promise<PlayableSet[]> {
  const rows = await getDb()
    .select({
      id: cardSetTranslations.setId,
      name: cardSetTranslations.name,
      logoUrl: cardSetTranslations.logoUrl,
    })
    .from(cardSetTranslations)
    .where(
      and(
        eq(cardSetTranslations.locale, locale),
        inArray(cardSetTranslations.setId, [...PLAYABLE_SET_IDS]),
      ),
    );

  return PLAYABLE_SET_IDS.flatMap((id) => {
    const row = rows.find((candidate) => candidate.id === id);
    return row && isPlayableSet(row.id)
      ? [{ id: row.id, name: row.name, logoUrl: row.logoUrl }]
      : [];
  });
}
