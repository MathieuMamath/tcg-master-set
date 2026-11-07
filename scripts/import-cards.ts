// Copies card sets from TCGdex into the database, so that the game never depends on the API
// while it runs. Images stay hosted by TCGdex. Running it again updates the same rows.
//
// Usage: pnpm cards:import <set id> [<set id>...]
//        pnpm cards:import all        every set the game plays with
//        pnpm cards:import missing    the ones that aren't in the database yet

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  CARD_LOCALES,
  type CardLocale,
  type CatalogueCard,
  catalogueSummary,
  expectedLogoUrl,
  logoFiles,
  mergeCardLanguages,
  type ParsedCard,
  type ParsedSet,
  parseCard,
  parseSet,
} from '../cards/tcgdex';
import { cardSets, cardSetTranslations, cards, cardTranslations, cardVariants } from '../db/schema';
import { boosterRecipe, unreachableSlots } from '../game/booster';
import { isPlayableSet, PLAYABLE_SET_IDS } from '../game/card-sets';

const API_URL = 'https://api.tcgdex.net/v2';
const CONCURRENT_REQUESTS = 5;
const MAX_ATTEMPTS = 6;
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
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MILLISECONDS * 2 ** attempt));
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

// Saved all the same: the game shows the card's name until the image appears there.
async function unavailableImages(catalogue: readonly CatalogueCard[]) {
  const imageUrls = catalogue.flatMap(({ translations }) =>
    translations.flatMap(({ imageUrl }) => (imageUrl ? [imageUrl] : [])),
  );
  const checks = await mapWithLimit(imageUrls, CONCURRENT_REQUESTS, async (imageUrl) => {
    const response = await fetch(`${imageUrl}/low.webp`, { method: 'HEAD' });
    return response.ok ? [] : [imageUrl];
  });

  return checks.flat();
}

async function withLogo(locale: CardLocale, set: ParsedSet) {
  if (set.logoUrl || !set.seriesId) {
    return { locale, set };
  }

  // Checked as an image, because the image server answers 200 for addresses that don't exist, and
  // in each format, as some logos only exist as one of them.
  const logoUrl = expectedLogoUrl(locale, set.seriesId, set.id);
  for (const file of logoFiles(logoUrl)) {
    const response = await fetch(file, { method: 'HEAD' });
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      return { locale, set: { ...set, logoUrl } };
    }
  }
  return { locale, set };
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

async function importSet(db: ReturnType<typeof drizzle>, setId: string) {
  const { english, translations } = await fetchSet(setId);
  console.info(`Importing ${english.name} (${setId}): ${english.cardIds.length} cards...`);

  const catalogue = await mapWithLimit(english.cardIds, CONCURRENT_REQUESTS, fetchCard);
  if (catalogue.length === 0) {
    throw new Error(`Set ${setId} has no cards`);
  }

  await saveSet(db, english, translations, catalogue);
  console.info(JSON.stringify(catalogueSummary(catalogue), null, 2));

  const unavailable = await unavailableImages(catalogue);
  if (unavailable.length > 0) {
    console.warn(`TCGdex has no image at: ${unavailable.join(', ')}`);
  }

  const unreachable = isPlayableSet(setId)
    ? unreachableSlots(catalogue, boosterRecipe(setId, catalogue))
    : [];
  if (unreachable.length > 0) {
    console.warn(`No booster of ${setId} can give: ${unreachable.join(', ')}`);
  }
}

async function setsToImport(db: ReturnType<typeof drizzle>, requested: readonly string[]) {
  if (requested.includes('all')) {
    return [...PLAYABLE_SET_IDS];
  }
  if (requested.includes('missing')) {
    const imported = await db.select({ id: cardSets.id }).from(cardSets);
    return PLAYABLE_SET_IDS.filter((id) => !imported.some((set) => set.id === id));
  }
  return requested;
}

async function main() {
  const requested = process.argv.slice(2);
  const connectionString = process.env.DATABASE_URL;

  if (requested.length === 0) {
    throw new Error('Usage: pnpm cards:import <set id> [<set id>...], or all, or missing');
  }
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local.');
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  const failed: string[] = [];

  try {
    // One set failing doesn't stop the others, since a long import can meet a passing API error.
    for (const setId of await setsToImport(db, requested)) {
      try {
        await importSet(db, setId);
      } catch (error) {
        failed.push(setId);
        console.error(`Set ${setId} failed:`, error instanceof Error ? error.message : error);
      }
    }
  } finally {
    await pool.end();
  }

  if (failed.length > 0) {
    throw new Error(`These sets failed: ${failed.join(' ')}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
