const ASSETS_URL = 'https://assets.tcgdex.net';

export const CARD_LOCALES = ['en', 'fr'] as const;

export type CardLocale = (typeof CARD_LOCALES)[number];

export type ParsedSet = {
  id: string;
  seriesId: string | null;
  name: string;
  releaseDate: string;
  officialCardCount: number;
  totalCardCount: number;
  logoUrl: string | null;
  symbolUrl: string | null;
  cardIds: string[];
};

export type ParsedCard = {
  id: string;
  setId: string;
  localId: string;
  name: string;
  category: string;
  rarity: string | null;
  imageUrl: string | null;
  variants: string[];
};

export type CatalogueCard = {
  id: string;
  setId: string;
  localId: string;
  category: string;
  rarity: string | null;
  variants: string[];
  translations: {
    locale: CardLocale;
    name: string;
    rarity: string | null;
    imageUrl: string | null;
  }[];
};

type Json = Record<string, unknown>;

function isJson(value: unknown): value is Json {
  return typeof value === 'object' && value !== null;
}

function requiredString(source: Json, field: string, context: string): string {
  const value = source[field];
  if (typeof value !== 'string' || value === '') {
    throw new Error(`${context}: "${field}" should be a non-empty string`);
  }
  return value;
}

function optionalString(source: Json, field: string): string | null {
  const value = source[field];
  return typeof value === 'string' && value !== '' ? value : null;
}

function requiredObject(source: Json, field: string, context: string): Json {
  const value = source[field];
  if (!isJson(value)) {
    throw new Error(`${context}: "${field}" should be an object`);
  }
  return value;
}

function requiredCount(source: Json, field: string, context: string): number {
  const value = source[field];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${context}: "${field}" should be a positive whole number`);
  }
  return value;
}

// Where the image server keeps a logo, for the recent sets whose API response leaves it out.
export function expectedLogoUrl(locale: CardLocale, seriesId: string, setId: string) {
  return `${ASSETS_URL}/${locale}/${seriesId}/${setId}/logo`;
}

export function parseSet(response: unknown): ParsedSet {
  if (!isJson(response)) {
    throw new Error('Set: the response should be an object');
  }
  const id = requiredString(response, 'id', 'Set');
  const context = `Set ${id}`;
  const cardCount = requiredObject(response, 'cardCount', context);
  const cardList = response.cards;
  if (!Array.isArray(cardList)) {
    throw new Error(`${context}: "cards" should be a list`);
  }

  return {
    id,
    seriesId: isJson(response.serie) ? optionalString(response.serie, 'id') : null,
    name: requiredString(response, 'name', context),
    releaseDate: requiredString(response, 'releaseDate', context),
    officialCardCount: requiredCount(cardCount, 'official', context),
    totalCardCount: requiredCount(cardCount, 'total', context),
    logoUrl: optionalString(response, 'logo'),
    symbolUrl: optionalString(response, 'symbol'),
    cardIds: cardList.map((card) => {
      if (!isJson(card)) {
        throw new Error(`${context}: every card should be an object`);
      }
      return requiredString(card, 'id', context);
    }),
  };
}

export function parseCard(response: unknown): ParsedCard {
  if (!isJson(response)) {
    throw new Error('Card: the response should be an object');
  }
  const id = requiredString(response, 'id', 'Card');
  const context = `Card ${id}`;
  const variants = requiredObject(response, 'variants', context);

  return {
    id,
    setId: requiredString(requiredObject(response, 'set', context), 'id', context),
    localId: requiredString(response, 'localId', context),
    name: requiredString(response, 'name', context),
    category: requiredString(response, 'category', context),
    rarity: optionalString(response, 'rarity'),
    imageUrl: optionalString(response, 'image'),
    variants: Object.keys(variants)
      .filter((variant) => variants[variant] === true)
      .sort(),
  };
}

// English is required, because game rules read its category and rarity. Other languages are
// optional, since a card doesn't always exist in every language.
export function mergeCardLanguages(
  english: ParsedCard,
  others: Partial<Record<CardLocale, ParsedCard>>,
): CatalogueCard {
  const byLocale = { ...others, en: english };

  return {
    id: english.id,
    setId: english.setId,
    localId: english.localId,
    category: english.category,
    rarity: english.rarity,
    variants: english.variants,
    translations: CARD_LOCALES.flatMap((locale) => {
      const card = byLocale[locale];
      return card
        ? [{ locale, name: card.name, rarity: card.rarity, imageUrl: card.imageUrl }]
        : [];
    }),
  };
}

export function catalogueSummary(cards: readonly CatalogueCard[]) {
  const rarities: Record<string, number> = {};
  for (const { rarity } of cards) {
    const label = rarity ?? 'None';
    rarities[label] = (rarities[label] ?? 0) + 1;
  }

  return {
    cards: cards.length,
    masterSetSlots: cards.reduce((total, card) => total + card.variants.length, 0),
    rarities,
    missingTranslations: cards
      .filter((card) => card.translations.length < CARD_LOCALES.length)
      .map((card) => card.id),
    missingImages: cards
      .filter((card) => card.translations.some((translation) => !translation.imageUrl))
      .map((card) => card.id),
  };
}
