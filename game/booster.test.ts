import { describe, expect, test } from 'vitest';
import {
  BOOSTER_RECIPES,
  type BoosterRecipe,
  boosterSize,
  drawBooster,
  drawGodPack,
  isTearComplete,
  openBooster,
  type PoolCard,
  revealRank,
  tearProgress,
  unreachableSlots,
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

// Placeholder cards with the rarities and variants of each set.
const POOL: PoolCard[] = [
  ...cardsOf('Common', 20),
  ...cardsOf('Uncommon', 20),
  ...cardsOf('Rare', 10, ['normal', 'holo', 'reverse']),
  ...cardsOf('Holo Rare', 5, ['holo', 'reverse']),
  ...cardsOf('Holo Rare V', 3, ['holo']),
  ...cardsOf('Holo Rare VMAX', 2, ['holo']),
  ...cardsOf('Ultra Rare', 3, ['holo']),
  ...cardsOf('Secret Rare', 2, ['holo']),
];

const CELEBRATION_RECIPE = BOOSTER_RECIPES['30th'];
const CELEBRATION_POOL: PoolCard[] = [
  ...cardsOf('Common', 20, ['normal']),
  ...cardsOf('Pikachu Rare', 5, ['holo']),
  ...cardsOf('Illustration rare', 5, ['holo']),
  ...cardsOf('Rare', 5, ['normal']),
  ...cardsOf('Double rare', 5, ['holo']),
  ...cardsOf('Special illustration rare', 3, ['holo']),
  ...cardsOf('RGB Rare', 2, ['holo']),
  ...cardsOf('Futuristic Rare', 2, ['holo']),
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

function manyBoosters(pool: readonly PoolCard[], recipe: BoosterRecipe, count = 4000) {
  return Array.from({ length: count }, (_, index) => drawBooster(pool, recipe, seeded(index + 1)));
}

describe.each([
  ['Darkness Ablaze', POOL, RECIPE],
  ['30th Celebration', CELEBRATION_POOL, CELEBRATION_RECIPE],
])('the %s booster', (_, pool, recipe) => {
  test('holds ten cards, never twice the same', () => {
    for (const booster of manyBoosters(pool, recipe, 500)) {
      expect(booster).toHaveLength(10);
      expect(new Set(booster?.map(({ cardId }) => cardId)).size).toBe(10);
    }
  });

  test('only gives a variant the card really has', () => {
    for (const booster of manyBoosters(pool, recipe, 500)) {
      for (const { cardId, variant } of booster ?? []) {
        expect(pool.find(({ id }) => id === cardId)?.variants).toContain(variant);
      }
    }
  });

  test('reveals its best card last', () => {
    for (const booster of manyBoosters(pool, recipe, 500)) {
      const ranks = (booster ?? []).map(({ cardId, variant }) =>
        revealRank(recipe, rarityOf(cardId), variant),
      );

      expect(ranks).toEqual([...ranks].sort((first, second) => first - second));
    }
  });

  test('leaves every card obtainable', () => {
    expect(unreachableSlots(pool, recipe)).toEqual([]);
  });

  test('really does give every version of every card over many boosters', () => {
    const seen = new Set(
      manyBoosters(pool, recipe, 20000).flatMap((booster) =>
        (booster ?? []).map(({ cardId, variant }) => `${cardId} ${variant}`),
      ),
    );

    for (const { id, variants } of pool) {
      for (const variant of variants) {
        expect(seen).toContain(`${id} ${variant}`);
      }
    }
  });
});

describe('drawBooster', () => {
  test('follows the slots of a standard booster', () => {
    const rarities = drawBooster(POOL, RECIPE, seeded(1))?.map(({ cardId }) => rarityOf(cardId));

    expect(rarities?.filter((rarity) => rarity === 'Common').length).toBeGreaterThanOrEqual(4);
    expect(rarities?.filter((rarity) => rarity === 'Uncommon').length).toBeGreaterThanOrEqual(3);
  });

  test('always gives at least one reverse', () => {
    for (const booster of manyBoosters(POOL, RECIPE, 500)) {
      expect(booster?.some(({ variant }) => variant === 'reverse')).toBe(true);
    }
  });

  test('a rarer outcome stays rare across many boosters', () => {
    const cards = manyBoosters(POOL, RECIPE).flatMap((booster) => booster ?? []);
    const count = (rarity: string) =>
      cards.filter(({ cardId }) => rarityOf(cardId) === rarity).length;

    expect(count('Holo Rare V')).toBeGreaterThan(count('Ultra Rare'));
    expect(count('Ultra Rare')).toBeGreaterThan(count('Secret Rare'));
  });

  test('falls back on the usual result when the rolled rarity is missing from the set', () => {
    const noSecret = POOL.filter(({ rarity }) => rarity !== 'Secret Rare');
    const highRoll = () => 0.999;

    expect(drawBooster(noSecret, RECIPE, highRoll)).toHaveLength(BOOSTER_SIZE);
  });

  test('refuses a pool too small for a whole booster', () => {
    expect(drawBooster(cardsOf('Common', 3), RECIPE)).toBeNull();
    expect(drawBooster([], RECIPE)).toBeNull();
  });
});

describe('the 30th Celebration slots', () => {
  test('nearly always give a Pikachu, which only an Illustration rare replaces', () => {
    for (const booster of manyBoosters(CELEBRATION_POOL, CELEBRATION_RECIPE, 500)) {
      const rarities = (booster ?? []).map(({ cardId }) => rarityOf(cardId));

      expect(rarities.includes('Pikachu Rare') || rarities.includes('Illustration rare')).toBe(
        true,
      );
    }
  });
});

describe.each([
  ['Darkness Ablaze', POOL, RECIPE],
  ['30th Celebration', CELEBRATION_POOL, CELEBRATION_RECIPE],
])('a %s god pack', (_, pool, recipe) => {
  test('holds ten different cards, all of them hits, best last', () => {
    for (const booster of Array.from({ length: 200 }, (_, seed) =>
      drawGodPack(pool, recipe, seeded(seed + 1)),
    )) {
      const cards = booster ?? [];
      const ranks = cards.map(({ cardId, variant }) =>
        revealRank(recipe, rarityOf(cardId), variant),
      );

      expect(new Set(cards.map(({ cardId }) => cardId)).size).toBe(10);
      expect(cards.every(({ cardId }) => recipe.godPackRarities.includes(rarityOf(cardId)))).toBe(
        true,
      );
      expect(ranks).toEqual([...ranks].sort((first, second) => first - second));
    }
  });
});

describe('openBooster', () => {
  const rolls = (...values: number[]) => {
    const queue = [...values];
    return () => queue.shift() ?? 0.5;
  };

  test('gives a god pack on a roll under its chance', () => {
    const opened = openBooster(POOL, RECIPE, rolls(0.00049));

    expect(opened?.isGodPack).toBe(true);
    expect(opened?.cards).toHaveLength(10);
  });

  test('gives a usual booster on any other roll', () => {
    const opened = openBooster(POOL, RECIPE, rolls(0.0005));

    expect(opened?.isGodPack).toBe(false);
    expect(opened?.cards).toHaveLength(10);
  });

  test('stays around one booster in two thousand', () => {
    const random = seeded(7);
    const godPacks = Array.from({ length: 100000 }, () => openBooster(POOL, RECIPE, random)).filter(
      (opened) => opened?.isGodPack,
    ).length;

    expect(godPacks).toBeGreaterThan(25);
    expect(godPacks).toBeLessThan(80);
  });

  test('falls back on a usual booster when the set has too few hits', () => {
    const fewHits = POOL.filter(
      ({ rarity }) => rarity !== 'Ultra Rare' && rarity !== 'Holo Rare V',
    );

    expect(openBooster(fewHits, RECIPE, rolls(0))?.isGodPack).toBe(false);
  });
});

describe('unreachableSlots', () => {
  test('names the versions no slot could give', () => {
    const pool = [
      { id: 'kept', rarity: 'Common', variants: ['normal', 'reverse'] },
      { id: 'unknown', rarity: 'Promo', variants: ['holo'] },
      { id: 'no-rarity', rarity: null, variants: ['normal'] },
    ];

    expect(unreachableSlots(pool, RECIPE)).toEqual(['unknown (holo)', 'no-rarity (normal)']);
  });

  test('notices a reverse in a set whose boosters give none', () => {
    expect(
      unreachableSlots(
        [{ id: 'card', rarity: 'Common', variants: ['normal', 'reverse'] }],
        CELEBRATION_RECIPE,
      ),
    ).toEqual(['card (reverse)']);
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
