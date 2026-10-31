import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { cardSetTranslations, cards, cardTranslations, cardVariants } from '@/db/schema';
import type { BinderCard } from '@/game/binder';

export async function loadBinderCatalogue(
  setId: string,
  locale: string,
): Promise<{ setName: string; cards: BinderCard[] }> {
  const db = getDb();
  const [set] = await db
    .select({ name: cardSetTranslations.name })
    .from(cardSetTranslations)
    .where(and(eq(cardSetTranslations.setId, setId), eq(cardSetTranslations.locale, locale)));
  const setCards = await db
    .select({ id: cards.id, localId: cards.localId })
    .from(cards)
    .where(eq(cards.setId, setId));
  const cardIds = setCards.map(({ id }) => id);

  if (cardIds.length === 0) {
    return { setName: set?.name ?? '', cards: [] };
  }

  const [translations, variants] = await Promise.all([
    db
      .select()
      .from(cardTranslations)
      .where(
        and(
          inArray(cardTranslations.cardId, cardIds),
          inArray(cardTranslations.locale, [locale, 'en']),
        ),
      ),
    db.select().from(cardVariants).where(inArray(cardVariants.cardId, cardIds)),
  ]);

  return {
    setName: set?.name ?? '',
    cards: setCards.map(({ id, localId }) => {
      const forCard = translations.filter(({ cardId }) => cardId === id);
      const translation = forCard.find((row) => row.locale === locale) ?? forCard[0];
      return {
        id,
        localId,
        name: translation?.name ?? id,
        rarity: translation?.rarity ?? null,
        imageUrl: translation?.imageUrl ?? null,
        variants: variants.filter(({ cardId }) => cardId === id).map(({ variant }) => variant),
      };
    }),
  };
}
