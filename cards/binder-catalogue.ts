import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { cardSetTranslations, cards, cardTranslations, cardVariants } from '@/db/schema';
import type { BinderCard } from '@/game/cards/binder';
import { isFullArtRarity } from '@/game/cards/foil';

export async function loadBinderCatalogue(
  setId: string,
  locale: string,
): Promise<{ setName: string; cards: BinderCard[] }> {
  const db = getDb();
  const names = await db
    .select({ locale: cardSetTranslations.locale, name: cardSetTranslations.name })
    .from(cardSetTranslations)
    .where(
      and(
        eq(cardSetTranslations.setId, setId),
        inArray(cardSetTranslations.locale, [locale, 'en']),
      ),
    );
  // Many older sets never came out in every language.
  const set = names.find((name) => name.locale === locale) ?? names[0];
  const setCards = await db
    .select({ id: cards.id, localId: cards.localId, rarity: cards.rarity })
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
    cards: setCards.map(({ id, localId, rarity }) => {
      const forCard = translations.filter(({ cardId }) => cardId === id);
      const translation = forCard.find((row) => row.locale === locale) ?? forCard[0];
      return {
        id,
        localId,
        name: translation?.name ?? id,
        rarity: translation?.rarity ?? null,
        // Older cards often only have a scan in one of the languages.
        imageUrl: translation?.imageUrl ?? forCard.find((row) => row.imageUrl)?.imageUrl ?? null,
        variants: variants.filter(({ cardId }) => cardId === id).map(({ variant }) => variant),
        isFullArt: isFullArtRarity(rarity),
      };
    }),
  };
}
