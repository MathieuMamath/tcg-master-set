import { describe, expect, test } from 'vitest';
import { routing } from '@/i18n/routing';
import {
  CARD_LOCALES,
  catalogueSummary,
  expectedLogoUrl,
  mergeCardLanguages,
  type ParsedCard,
  parseCard,
  parseSet,
} from './tcgdex';

// Placeholder data with the API's shape: no real card data belongs in this repository.
const SET_RESPONSE = {
  id: 'set-1',
  serie: { id: 'series-1' },
  name: 'Placeholder Set',
  releaseDate: '2020-01-01',
  logo: 'https://example.test/logo',
  symbol: 'https://example.test/symbol',
  cardCount: { official: 1, total: 2, normal: 1 },
  cards: [{ id: 'set-1-1' }, { id: 'set-1-2' }],
};

const CARD_RESPONSE = {
  id: 'set-1-1',
  localId: '1',
  name: 'Placeholder Card',
  category: 'Trainer',
  rarity: 'Common',
  image: 'https://example.test/card',
  set: { id: 'set-1' },
  variants: { reverse: true, normal: true, holo: false, firstEdition: false },
};

const ENGLISH = parseCard(CARD_RESPONSE);
const FRENCH: ParsedCard = { ...ENGLISH, name: 'Carte factice', rarity: 'Commune' };

describe('CARD_LOCALES', () => {
  test('covers the languages of the game', () => {
    expect(CARD_LOCALES).toEqual(routing.locales);
  });
});

describe('expectedLogoUrl', () => {
  test('follows the layout of the image server', () => {
    expect(expectedLogoUrl('fr', 'series-1', 'set-1')).toBe(
      'https://assets.tcgdex.net/fr/series-1/set-1/logo',
    );
  });
});

describe('parseSet', () => {
  test('reads a set and its card list', () => {
    expect(parseSet(SET_RESPONSE)).toEqual({
      id: 'set-1',
      seriesId: 'series-1',
      name: 'Placeholder Set',
      releaseDate: '2020-01-01',
      officialCardCount: 1,
      totalCardCount: 2,
      logoUrl: 'https://example.test/logo',
      symbolUrl: 'https://example.test/symbol',
      cardIds: ['set-1-1', 'set-1-2'],
    });
  });

  test('accepts a set without a logo or symbol', () => {
    const { logo: _logo, symbol: _symbol, ...withoutImages } = SET_RESPONSE;

    expect(parseSet(withoutImages)).toMatchObject({ logoUrl: null, symbolUrl: null });
  });

  test.each([
    ['a missing card list', { ...SET_RESPONSE, cards: undefined }],
    ['a missing card count', { ...SET_RESPONSE, cardCount: undefined }],
    ['an invalid card count', { ...SET_RESPONSE, cardCount: { official: 'many', total: 2 } }],
    ['a card without an id', { ...SET_RESPONSE, cards: [{}] }],
    ['an unexpected response', null],
  ])('rejects %s', (_, response) => {
    expect(() => parseSet(response)).toThrow();
  });
});

describe('parseCard', () => {
  test('reads a card and only keeps its existing variants', () => {
    expect(ENGLISH).toEqual({
      id: 'set-1-1',
      setId: 'set-1',
      localId: '1',
      name: 'Placeholder Card',
      category: 'Trainer',
      rarity: 'Common',
      imageUrl: 'https://example.test/card',
      variants: ['normal', 'reverse'],
    });
  });

  test('accepts a card without a rarity or image', () => {
    const { rarity: _rarity, image: _image, ...partial } = CARD_RESPONSE;

    expect(parseCard(partial)).toMatchObject({ rarity: null, imageUrl: null });
  });

  test('names the card in its errors', () => {
    expect(() => parseCard({ ...CARD_RESPONSE, name: undefined })).toThrow('set-1-1');
  });
});

describe('mergeCardLanguages', () => {
  test('keeps the English rarity for the rules and each language for display', () => {
    const merged = mergeCardLanguages(ENGLISH, { fr: FRENCH });

    expect(merged.rarity).toBe('Common');
    expect(merged.translations).toEqual([
      { locale: 'en', name: 'Placeholder Card', rarity: 'Common', imageUrl: ENGLISH.imageUrl },
      { locale: 'fr', name: 'Carte factice', rarity: 'Commune', imageUrl: FRENCH.imageUrl },
    ]);
  });

  test('accepts a card missing from a language', () => {
    expect(mergeCardLanguages(ENGLISH, {}).translations.map(({ locale }) => locale)).toEqual([
      'en',
    ]);
  });
});

describe('catalogueSummary', () => {
  test('counts cards, master set slots and rarities', () => {
    const common = mergeCardLanguages(ENGLISH, { fr: FRENCH });
    const noRarity = mergeCardLanguages(
      { ...ENGLISH, id: 'set-1-2', rarity: null, variants: ['holo'] },
      { fr: { ...FRENCH, id: 'set-1-2' } },
    );

    expect(catalogueSummary([common, noRarity])).toEqual({
      cards: 2,
      masterSetSlots: 3,
      rarities: { Common: 1, None: 1 },
      missingTranslations: [],
      missingImages: [],
    });
  });

  test('reports missing translations and images', () => {
    const incomplete = mergeCardLanguages({ ...ENGLISH, imageUrl: null }, {});

    expect(catalogueSummary([incomplete])).toMatchObject({
      missingTranslations: ['set-1-1'],
      missingImages: ['set-1-1'],
    });
  });
});
