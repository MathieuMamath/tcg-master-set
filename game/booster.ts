import type { SetId } from './card-sets';

// Booster contents. These numbers are provisional, until real drop rates are chosen.

export type PoolCard = {
  id: string;
  rarity: string | null;
  variants: readonly string[];
};

export type DrawnCard = {
  cardId: string;
  variant: string;
};

export type BoosterRecipe = {
  slots: readonly { rarity: string; count: number }[];
  reverseSlots: number;
  // The last slot, from the most common result to the rarest. Each weight is out of 100.
  rareSlotOdds: readonly { rarity: string; weight: number }[];
};

export const BOOSTER_RECIPES: Record<SetId, BoosterRecipe> = {
  swsh3: {
    slots: [
      { rarity: 'Common', count: 5 },
      { rarity: 'Uncommon', count: 3 },
    ],
    reverseSlots: 1,
    rareSlotOdds: [
      { rarity: 'Rare', weight: 62 },
      { rarity: 'Holo Rare', weight: 20 },
      { rarity: 'Holo Rare V', weight: 9 },
      { rarity: 'Holo Rare VMAX', weight: 4 },
      { rarity: 'Ultra Rare', weight: 3 },
      { rarity: 'Secret Rare', weight: 2 },
    ],
  },
  // Five cards, one of them a Pikachu, like the real pack apart from its energy card, which the
  // catalogue doesn't list.
  '30th': {
    slots: [
      { rarity: 'Common', count: 3 },
      { rarity: 'Pikachu Rare', count: 1 },
    ],
    reverseSlots: 0,
    rareSlotOdds: [
      { rarity: 'Rare', weight: 60 },
      { rarity: 'Double rare', weight: 22 },
      { rarity: 'Illustration rare', weight: 11 },
      { rarity: 'Special illustration rare', weight: 4 },
      { rarity: 'RGB Rare', weight: 2 },
      { rarity: 'Futuristic Rare', weight: 1 },
    ],
  },
};

export function boosterSize({ slots, reverseSlots }: BoosterRecipe): number {
  return slots.reduce((total, { count }) => total + count, reverseSlots + 1);
}

type Random = () => number;

function pickOne<Card>(cards: readonly Card[], random: Random): Card | undefined {
  return cards[Math.floor(random() * cards.length)];
}

function pickRareRarity(odds: BoosterRecipe['rareSlotOdds'], random: Random): string | undefined {
  let roll = random() * 100;
  for (const { rarity, weight } of odds) {
    roll -= weight;
    if (roll < 0) {
      return rarity;
    }
  }
  return odds[0]?.rarity;
}

function baseVariant(card: PoolCard): string {
  return card.variants.includes('normal') ? 'normal' : (card.variants[0] ?? 'normal');
}

// Returns null when the pool can't fill a whole booster.
export function drawBooster(
  pool: readonly PoolCard[],
  recipe: BoosterRecipe,
  random: Random = Math.random,
): DrawnCard[] | null {
  const drawn: DrawnCard[] = [];
  const used = new Set<string>();

  const draw = (candidates: readonly PoolCard[], variantOf: (card: PoolCard) => string) => {
    const card = pickOne(
      candidates.filter(({ id }) => !used.has(id)),
      random,
    );
    if (card) {
      used.add(card.id);
      drawn.push({ cardId: card.id, variant: variantOf(card) });
    }
  };
  const withRarity = (rarity: string | undefined) => pool.filter((card) => card.rarity === rarity);

  for (const { rarity, count } of recipe.slots) {
    for (let slot = 0; slot < count; slot++) {
      draw(withRarity(rarity), baseVariant);
    }
  }
  for (let slot = 0; slot < recipe.reverseSlots; slot++) {
    draw(
      pool.filter(({ variants }) => variants.includes('reverse')),
      () => 'reverse',
    );
  }

  // A set without the rarity that was rolled falls back on any card of the rare slot.
  const rolled = withRarity(pickRareRarity(recipe.rareSlotOdds, random));
  const rareSlotRarities = recipe.rareSlotOdds.map(({ rarity }) => rarity);
  draw(
    rolled.length > 0
      ? rolled
      : pool.filter(({ rarity }) => rarity !== null && rareSlotRarities.includes(rarity)),
    baseVariant,
  );

  return drawn.length === boosterSize(recipe) ? drawn : null;
}

const TEAR_COMPLETE_AT = 0.75;

// How far along the pack's width a drag has gone, from 0 to 1, in either direction.
export function tearProgress(startX: number, currentX: number, packWidth: number): number {
  return Math.min(Math.abs(currentX - startX) / packWidth, 1);
}

export function isTearComplete(progress: number): boolean {
  return progress >= TEAR_COMPLETE_AT;
}
