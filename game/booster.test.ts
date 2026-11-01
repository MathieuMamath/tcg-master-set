import { describe, expect, test } from 'vitest';
import {
  BOOSTER_RECIPES,
  boosterSize,
  drawBooster,
  isTearComplete,
  type PoolCard,
  tearProgress,
} from './booster';

const RECIPE = BOOSTER_RECIPES.swsh3;
const BOOSTER_SIZE = boosterSize(RECIPE);

function cardsOf(rarity: string, count: number, variants = ['normal', 'reverse']): PoolCard[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${rarity}-${index}`,
    rarity,
    variants,
  }));
}

const POOL: PoolCard[] = [
  ...cardsOf('Common', 20),
  ...cardsOf('Uncommon', 20),
  ...cardsOf('Rare', 10),
  ...cardsOf('Holo Rare', 5, ['holo', 'reverse']),
  ...cardsOf('Secret Rare', 2, ['holo']),
];

// A repeatable stand-in for Math.random.
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function rarityOf(cardId: string): string {
  return cardId.slice(0, cardId.lastIndexOf('-'));
}

describe('drawBooster', () => {
  test('fills every slot, in order from common to rare', () => {
    const drawn = drawBooster(POOL, RECIPE, seeded(1));

    expect(drawn).toHaveLength(BOOSTER_SIZE);
    expect(drawn?.slice(0, 5).map(({ cardId }) => rarityOf(cardId))).toEqual(
      Array(5).fill('Common'),
    );
    expect(drawn?.slice(5, 8).map(({ cardId }) => rarityOf(cardId))).toEqual(
      Array(3).fill('Uncommon'),
    );
    expect(drawn?.[8].variant).toBe('reverse');
    expect(['Rare', 'Holo Rare', 'Secret Rare']).toContain(rarityOf(drawn?.[9].cardId ?? ''));
  });

  test('never repeats a card within a booster', () => {
    for (let seed = 1; seed < 200; seed++) {
      const ids = drawBooster(POOL, RECIPE, seeded(seed))?.map(({ cardId }) => cardId);

      expect(new Set(ids).size).toBe(BOOSTER_SIZE);
    }
  });

  test('only gives a variant the card really has', () => {
    for (let seed = 1; seed < 200; seed++) {
      for (const { cardId, variant } of drawBooster(POOL, RECIPE, seeded(seed)) ?? []) {
        expect(POOL.find(({ id }) => id === cardId)?.variants).toContain(variant);
      }
    }
  });

  test('a rarer roll stays rare across many boosters', () => {
    const lastSlots = Array.from({ length: 4000 }, (_, index) =>
      rarityOf(drawBooster(POOL, RECIPE, seeded(index + 1))?.[9].cardId ?? ''),
    );
    const rares = lastSlots.filter((rarity) => rarity === 'Rare').length;
    const secrets = lastSlots.filter((rarity) => rarity === 'Secret Rare').length;

    expect(rares).toBeGreaterThan(secrets);
  });

  test('falls back on the rare slot when a rolled rarity is missing from the set', () => {
    const noUltra = POOL.filter(({ rarity }) => rarity !== 'Secret Rare');
    const highRoll = () => 0.999;

    expect(rarityOf(drawBooster(noUltra, RECIPE, highRoll)?.[9].cardId ?? '')).toMatch(/Rare/);
  });

  test('refuses a pool too small for a whole booster', () => {
    expect(drawBooster(cardsOf('Common', 3), RECIPE)).toBeNull();
    expect(drawBooster([], RECIPE)).toBeNull();
  });
});

describe('the 30th Celebration booster', () => {
  const recipe = BOOSTER_RECIPES['30th'];
  const pool: PoolCard[] = [
    ...cardsOf('Common', 20, ['normal']),
    ...cardsOf('Pikachu Rare', 5, ['holo']),
    ...cardsOf('Rare', 5, ['normal']),
    ...cardsOf('Futuristic Rare', 2, ['holo']),
  ];

  test('gives commons, a Pikachu and a rare, with no uncommon or reverse to need', () => {
    const drawn = drawBooster(pool, recipe, seeded(1)) ?? [];

    expect(drawn).toHaveLength(5);
    expect(drawn.slice(0, 3).map(({ cardId }) => rarityOf(cardId))).toEqual(
      Array(3).fill('Common'),
    );
    expect(rarityOf(drawn[3].cardId)).toBe('Pikachu Rare');
    expect(drawn[3].variant).toBe('holo');
    expect(['Rare', 'Futuristic Rare']).toContain(rarityOf(drawn[4].cardId));
  });
});

describe('tearing the pack', () => {
  test('follows the drag in either direction, up to the whole width', () => {
    expect(tearProgress(100, 150, 200)).toBe(0.25);
    expect(tearProgress(150, 100, 200)).toBe(0.25);
    expect(tearProgress(0, 900, 200)).toBe(1);
  });

  test('completes before the very end of the pack', () => {
    expect(isTearComplete(0.5)).toBe(false);
    expect(isTearComplete(0.8)).toBe(true);
  });
});
