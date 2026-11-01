import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { cardSetTranslations, cards, cardTranslations, cardVariants } from '@/db/schema';
import type { DrawnCard, PoolCard } from '@/game/booster';

export type OpenedCard = {
  id: string;
  name: string;
  rarity: string | null;
  variant: string;
  imageUrl: string | null;
};

export async function loadBoosterPool(setId: string): Promise<PoolCard[]> {
  const db = getDb();
  const rows = await db
    .select({ id: cards.id, rarity: cards.rarity, variant: cardVariants.variant })
    .from(cards)
    .innerJoin(cardVariants, eq(cardVariants.cardId, cards.id))
    .where(eq(cards.setId, setId));

  const pool = new Map<string, PoolCard & { variants: string[] }>();
  for (const { id, rarity, variant } of rows) {
    const card = pool.get(id) ?? { id, rarity, variants: [] };
    card.variants.push(variant);
    pool.set(id, card);
  }
  return [...pool.values()];
}

export async function loadOpenedCards(
  drawn: readonly DrawnCard[],
  setId: string,
  locale: string,
): Promise<{ setName: string; logoUrl: string | null; cards: OpenedCard[] }> {
  const db = getDb();
  const [set] = await db
    .select({ name: cardSetTranslations.name, logoUrl: cardSetTranslations.logoUrl })
    .from(cardSetTranslations)
    .where(and(eq(cardSetTranslations.setId, setId), eq(cardSetTranslations.locale, locale)));
  const translations = await db
    .select()
    .from(cardTranslations)
    .where(
      and(
        inArray(
          cardTranslations.cardId,
          drawn.map(({ cardId }) => cardId),
        ),
        inArray(cardTranslations.locale, [locale, 'en']),
      ),
    );

  return {
    setName: set?.name ?? '',
    logoUrl: set?.logoUrl ?? null,
    cards: drawn.map(({ cardId, variant }) => {
      const forCard = translations.filter((translation) => translation.cardId === cardId);
      const translation = forCard.find((row) => row.locale === locale) ?? forCard[0];
      return {
        id: cardId,
        name: translation?.name ?? cardId,
        rarity: translation?.rarity ?? null,
        variant,
        imageUrl: translation?.imageUrl ?? null,
      };
    }),
  };
}
