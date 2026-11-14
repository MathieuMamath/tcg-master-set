import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { cardSetTranslations, cards, cardTranslations, cardVariants } from '@/db/schema';
import type { DrawnCard, PoolCard } from '@/game/cards/booster';
import { isFullArtRarity } from '@/game/cards/foil';
import { cardTier, type PullTier } from '@/game/cards/pull-tier';

export type OpenedCard = {
  id: string;
  name: string;
  rarity: string | null;
  variant: string;
  imageUrl: string | null;
  // From the rarity in English, since `rarity` above is translated for display.
  tier: PullTier;
  // Whether its illustration covers the whole card, for its foil.
  isFullArt: boolean;
};

// A card as the player discovers it: either it fills an empty pocket of the binder, or it's a
// duplicate that brought these coins.
export type RevealedCard = OpenedCard & { isNew: boolean; coins: number };

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
  const setRows = await db
    .select({
      locale: cardSetTranslations.locale,
      name: cardSetTranslations.name,
      logoUrl: cardSetTranslations.logoUrl,
    })
    .from(cardSetTranslations)
    .where(
      and(
        eq(cardSetTranslations.setId, setId),
        inArray(cardSetTranslations.locale, [locale, 'en']),
      ),
    );
  // Many older sets never came out in every language.
  const set = setRows.find((row) => row.locale === locale) ?? setRows[0];
  const cardIds = drawn.map(({ cardId }) => cardId);
  const rarities = await db
    .select({ id: cards.id, rarity: cards.rarity })
    .from(cards)
    .where(inArray(cards.id, cardIds));
  const translations = await db
    .select()
    .from(cardTranslations)
    .where(
      and(
        inArray(cardTranslations.cardId, cardIds),
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
        // Older cards often only have a scan in one of the languages.
        imageUrl: translation?.imageUrl ?? forCard.find((row) => row.imageUrl)?.imageUrl ?? null,
        tier: cardTier(rarities.find(({ id }) => id === cardId)?.rarity ?? null),
        isFullArt: isFullArtRarity(rarities.find(({ id }) => id === cardId)?.rarity ?? null),
      };
    }),
  };
}
