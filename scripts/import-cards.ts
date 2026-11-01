// Copies card sets from TCGdex into the database, so that the game never depends on the API
// while it runs. Images stay hosted by TCGdex. Running it again updates the same rows.
//
// Usage: pnpm cards:import <set id> [<set id>...]

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  CARD_LOCALES,
  type CardLocale,
  type CatalogueCard,
  catalogueSummary,
  expectedLogoUrl,
  mergeCardLanguages,
  type ParsedCard,
  type ParsedSet,
  parseCard,
  parseSet,
} from '../cards/tcgdex';
import { cardSets, cardSetTranslations, cards, cardTranslations, cardVariants } from '../db/schema';

const API_URL = 'https://api.tcgdex.net/v2';
const CONCURRENT_REQUESTS = 5;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MILLISECONDS = 1000;
const REQUEST_TIMEOUT_MILLISECONDS = 30_000;

// Resolves to null only when the API says the resource doesn't exist.
async function fetchJson(path: string): Promise<unknown | null> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${API_URL}/${path}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS),
      });
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MILLISECONDS * attempt));
    }
  }

  throw new Error(`Could not fetch ${path}: ${String(lastError)}`);
}

async function mapWithLimit<Input, Output>(
  inputs: readonly Input[],
  limit: number,
  transform: (input: Input) => Promise<Output>,
): Promise<Output[]> {
  const outputs: Output[] = new Array(inputs.length);
  let next = 0;

  const worker = async () => {
    while (next < inputs.length) {
      const index = next++;
      outputs[index] = await transform(inputs[index]);
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));

  return outputs;
}

async function fetchCardInLocale(locale: CardLocale, id: string): Promise<ParsedCard | null> {
  const response = await fetchJson(`${locale}/cards/${id}`);
  return response === null ? null : parseCard(response);
}

async function fetchCard(id: string): Promise<CatalogueCard> {
  const [english, ...others] = await Promise.all(
    CARD_LOCALES.map((locale) => fetchCardInLocale(locale, id)),
  );
  if (!english) {
    throw new Error(`Card ${id} has no English version`);
  }

  const translations: Partial<Record<CardLocale, ParsedCard>> = {};
  others.forEach((card, index) => {
    if (card) {
      translations[CARD_LOCALES[index + 1]] = card;
    }
  });

  return mergeCardLanguages(english, translations);
}

async function withLogo(locale: CardLocale, set: ParsedSet) {
  if (set.logoUrl || !set.seriesId) {
    return { locale, set };
  }

  // Checked as an image, because the image server answers 200 for addresses that don't exist.
  const logoUrl = expectedLogoUrl(locale, set.seriesId, set.id);
  const response = await fetch(`${logoUrl}.png`, { method: 'HEAD' });
  const isImage = response.ok && response.headers.get('content-type')?.startsWith('image/');

  return { locale, set: isImage ? { ...set, logoUrl } : set };
}

async function fetchSet(id: string) {
  const responses = await Promise.all(
    CARD_LOCALES.map((locale) => fetchJson(`${locale}/sets/${id}`)),
  );
  const sets = await Promise.all(
    responses.flatMap((response, index) =>
      response === null ? [] : [withLogo(CARD_LOCALES[index], parseSet(response))],
    ),
  );
  const english = sets.find(({ locale }) => locale === 'en')?.set;
  if (!english) {
    throw new Error(`Set ${id} doesn't exist in English`);
  }

  return { english, translations: sets };
}

type Translations = { locale: CardLocale; set: ParsedSet }[];

async function saveSet(
  db: ReturnType<typeof drizzle>,
  set: ParsedSet,
  translations: Translations,
  catalogue: readonly CatalogueCard[],
) {
  const details = {
    releaseDate: set.releaseDate,
    officialCardCount: set.officialCardCount,
    totalCardCount: set.totalCardCount,
    symbolUrl: set.symbolUrl,
    importedAt: new Date(),
  };

  // All or nothing, so that a failed import never leaves a set half updated.
  await db.transaction(async (transaction) => {
    await transaction
      .insert(cardSets)
      .values({ id: set.id, ...details })
      .onConflictDoUpdate({ target: cardSets.id, set: details });

    // Replaced rather than merged, so that cards removed from the source disappear too.
    await transaction.delete(cards).where(eq(cards.setId, set.id));
    await transaction.delete(cardSetTranslations).where(eq(cardSetTranslations.setId, set.id));

    await transaction.insert(cardSetTranslations).values(
      translations.map(({ locale, set: translated }) => ({
        setId: set.id,
        locale,
        name: translated.name,
        logoUrl: translated.logoUrl,
      })),
    );
    await transaction.insert(cards).values(
      catalogue.map(({ id, setId, localId, category, rarity }) => ({
        id,
        setId,
        localId,
        category,
        rarity,
      })),
    );
    await transaction
      .insert(cardTranslations)
      .values(
        catalogue.flatMap(({ id, translations: names }) =>
          names.map((translation) => ({ cardId: id, ...translation })),
        ),
      );

    const variants = catalogue.flatMap(({ id, variants: names }) =>
      names.map((variant) => ({ cardId: id, variant })),
    );
    if (variants.length > 0) {
      await transaction.insert(cardVariants).values(variants);
    }
  });
}

async function main() {
  const setIds = process.argv.slice(2);
  const connectionString = process.env.DATABASE_URL;

  if (setIds.length === 0) {
    throw new Error('Usage: pnpm cards:import <set id> [<set id>...]');
  }
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local.');
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    for (const setId of setIds) {
      const { english, translations } = await fetchSet(setId);
      console.info(`Importing ${english.name} (${setId}): ${english.cardIds.length} cards...`);

      const catalogue = await mapWithLimit(english.cardIds, CONCURRENT_REQUESTS, fetchCard);
      if (catalogue.length === 0) {
        throw new Error(`Set ${setId} has no cards`);
      }

      await saveSet(db, english, translations, catalogue);
      console.info(JSON.stringify(catalogueSummary(catalogue), null, 2));
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
