import type { SetId } from './card-sets';
import { cardTier } from './pull-tier';

// Booster contents: ten cards in every set, with odds based on those players report for recent
// real boosters. No official rates exist. Each recipe adapts them to the rarities of its set, and
// must leave every card of the binder obtainable, which `unreachableSlots` checks.

export type PoolCard = {
  id: string;
  rarity: string | null;
  variants: readonly string[];
};

export type DrawnCard = {
  cardId: string;
  variant: string;
};

const REVERSE = 'reverse';

type Outcome = { source: readonly string[] | typeof REVERSE; weight: number };

// The first outcome is the usual one, and what the slot falls back on.
type BoosterSlot = readonly Outcome[];

export type BoosterRecipe = {
  slots: readonly BoosterSlot[];
  // The hits that fill a god pack, the rare booster drawn instead of the usual slots.
  godPackRarities: readonly string[];
  // From the first card revealed to the last, so that the best one comes at the end.
  revealOrder: readonly string[];
};

// The game's own rule, for every set: one booster in two thousand. Real sets don't all have them.
const GOD_PACK_CHANCE_PERCENT = 0.05;

function always(rarity: string, count: number): BoosterSlot[] {
  return Array.from({ length: count }, () => [{ source: [rarity], weight: 1 }]);
}

// Scarlet & Violet and Mega Evolution sets share their rarities, with a few names for their rarest
// cards, which share the rarest outcome.
const CHASE_RARITIES = ['Mega Attack Rare', 'Black White Rare', 'Hyper rare', 'Mega Hyper Rare'];

const RECENT_RECIPE: BoosterRecipe = {
  slots: [
    ...always('Common', 4),
    ...always('Uncommon', 3),
    [
      { source: REVERSE, weight: 92.5 },
      { source: ['Illustration rare'], weight: 7.5 },
    ],
    [
      { source: REVERSE, weight: 95 },
      { source: ['Special illustration rare'], weight: 3.2 },
      { source: CHASE_RARITIES, weight: 1.8 },
    ],
    [
      { source: ['Rare'], weight: 80 },
      { source: ['Double rare'], weight: 13.5 },
      { source: ['Ultra Rare'], weight: 6.5 },
    ],
  ],
  godPackRarities: [
    'Double rare',
    'Ultra Rare',
    'Illustration rare',
    'Special illustration rare',
    ...CHASE_RARITIES,
  ],
  revealOrder: [
    'Common',
    'Uncommon',
    REVERSE,
    'Rare',
    'Double rare',
    'Ultra Rare',
    'Illustration rare',
    'Special illustration rare',
    ...CHASE_RARITIES,
  ],
};

export const BOOSTER_RECIPES = {
  me05: RECENT_RECIPE,
  me04: RECENT_RECIPE,
  me03: RECENT_RECIPE,
  'me02.5': RECENT_RECIPE,
  me02: RECENT_RECIPE,
  me01: RECENT_RECIPE,
  'sv10.5w': RECENT_RECIPE,
  'sv10.5b': RECENT_RECIPE,
  sv10: RECENT_RECIPE,
  sv09: RECENT_RECIPE,
  swsh3: {
    slots: [
      ...always('Common', 4),
      ...always('Uncommon', 3),
      [{ source: REVERSE, weight: 1 }],
      [
        { source: REVERSE, weight: 98.2 },
        { source: ['Secret Rare'], weight: 1.8 },
      ],
      [
        { source: ['Rare', 'Holo Rare'], weight: 80 },
        { source: ['Holo Rare V', 'Holo Rare VMAX'], weight: 13.5 },
        { source: ['Ultra Rare'], weight: 6.5 },
      ],
    ],
    godPackRarities: ['Holo Rare V', 'Holo Rare VMAX', 'Ultra Rare', 'Secret Rare'],
    revealOrder: [
      'Common',
      'Uncommon',
      REVERSE,
      'Rare',
      'Holo Rare',
      'Holo Rare V',
      'Holo Rare VMAX',
      'Ultra Rare',
      'Secret Rare',
    ],
  },
  // This set has no uncommons or reverses, so commons fill those slots, and its Pikachu cards take
  // the first reverse slot.
  '30th': {
    slots: [
      ...always('Common', 7),
      [
        { source: ['Pikachu Rare'], weight: 92.5 },
        { source: ['Illustration rare'], weight: 7.5 },
      ],
      [
        { source: ['Common'], weight: 95 },
        { source: ['Special illustration rare'], weight: 3.2 },
        { source: ['RGB Rare', 'Futuristic Rare'], weight: 1.8 },
      ],
      [
        { source: ['Rare'], weight: 80 },
        { source: ['Double rare'], weight: 20 },
      ],
    ],
    godPackRarities: [
      'Pikachu Rare',
      'Double rare',
      'Illustration rare',
      'Special illustration rare',
      'RGB Rare',
      'Futuristic Rare',
    ],
    revealOrder: [
      'Common',
      'Rare',
      'Pikachu Rare',
      'Double rare',
      'Illustration rare',
      'Special illustration rare',
      'RGB Rare',
      'Futuristic Rare',
    ],
  },
} satisfies Partial<Record<SetId, BoosterRecipe>>;

// Every rarity of every era, from the most common to the rarest.
const RARITY_ORDER = [
  'None',
  'Common',
  'Uncommon',
  'Promo',
  'Rare',
  'Holo Rare',
  'Pikachu Rare',
  'Rare Holo',
  'Classic Collection',
  'Shiny rare',
  'Double rare',
  'Holo Rare V',
  'Holo Rare VMAX',
  'Holo Rare VSTAR',
  'Rare PRIME',
  'Rare Holo LV.X',
  'LEGEND',
  'Full Art Trainer',
  'Radiant Rare',
  'Amazing Rare',
  'ACE SPEC Rare',
  'Shiny rare V',
  'Ultra Rare',
  'Illustration rare',
  'Shiny rare VMAX',
  'Shiny Ultra Rare',
  'Special illustration rare',
  'Secret Rare',
  ...CHASE_RARITIES,
  'RGB Rare',
  'Futuristic Rare',
];

const NO_RARITY = 'None';
const COMMON_RARITIES = [NO_RARITY, 'Common'];
const LOW_RARITIES = [...COMMON_RARITIES, 'Uncommon'];
const USUAL_OUTCOME_WEIGHT = 95;
const HIT_OUTCOME_WEIGHT = 5;
const NEXT_RARITY_ODDS = 0.25;

function rarityRank(rarity: string): number {
  const rank = RARITY_ORDER.indexOf(rarity);
  // A rarity this game doesn't know yet counts as a plain rare.
  return rank === -1 ? RARITY_ORDER.indexOf('Rare') : rank;
}

// The rarer the rarity, the less often it comes, sharing out the given weight.
function decreasingOutcomes(rarities: readonly string[], total: number): Outcome[] {
  const shares = rarities.map((_, index) => NEXT_RARITY_ODDS ** index);
  const sum = shares.reduce((first, second) => first + second, 0);
  return rarities.map((rarity, index) => ({
    source: [rarity],
    weight: (shares[index] / sum) * total,
  }));
}

// The recipe of a set without one of its own, from whatever rarities its era had: the same ten
// slots as recent sets, where every rarity can come. Any card can also fill in, for the small sets
// that run out of a rarity.
export function genericRecipe(pool: readonly PoolCard[]): BoosterRecipe {
  const rarities = [...new Set(pool.map(({ rarity }) => rarity ?? NO_RARITY))].sort(
    (first, second) => rarityRank(first) - rarityRank(second),
  );
  const lows = rarities.filter((rarity) => LOW_RARITIES.includes(rarity));
  const highs = rarities.filter((rarity) => !LOW_RARITIES.includes(rarity));
  const commons = rarities.filter((rarity) => COMMON_RARITIES.includes(rarity));
  const firstSource = commons.length > 0 ? commons : rarities.slice(0, 1);
  const secondSource = rarities.includes('Uncommon') ? ['Uncommon'] : firstSource;
  const hasReverses = pool.some(({ variants }) => variants.includes(REVERSE));
  const filler: Outcome = { source: rarities, weight: 0 };

  const usualSource = hasReverses ? REVERSE : secondSource;
  const bestHalf = highs.slice(Math.floor(highs.length / 2));
  const hitSlot: BoosterSlot = [
    { source: usualSource, weight: USUAL_OUTCOME_WEIGHT },
    ...decreasingOutcomes(bestHalf, HIT_OUTCOME_WEIGHT),
    filler,
  ];
  const rareSlot: BoosterSlot =
    highs.length > 0
      ? [...decreasingOutcomes(highs, 1), filler]
      : [{ source: secondSource, weight: 1 }, filler];
  const hits = rarities.filter((rarity) => cardTier(rarity) > 0);

  return {
    slots: [
      ...Array.from({ length: 4 }, () => [{ source: firstSource, weight: 1 }, filler]),
      ...Array.from({ length: 3 }, () => [{ source: secondSource, weight: 1 }, filler]),
      hitSlot,
      hitSlot,
      rareSlot,
    ],
    godPackRarities: hits.length > 0 ? hits : highs,
    revealOrder: [...lows, REVERSE, ...highs],
  };
}

export function boosterRecipe(setId: SetId, pool: readonly PoolCard[]): BoosterRecipe {
  const recipes: Partial<Record<SetId, BoosterRecipe>> = BOOSTER_RECIPES;
  return recipes[setId] ?? genericRecipe(pool);
}

export function boosterSize({ slots }: BoosterRecipe): number {
  return slots.length;
}

type Random = () => number;

function pickOne<Card>(cards: readonly Card[], random: Random): Card | undefined {
  return cards[Math.floor(random() * cards.length)];
}

function pickOutcome(slot: BoosterSlot, random: Random): Outcome {
  let roll = random() * slot.reduce((total, { weight }) => total + weight, 0);
  for (const outcome of slot) {
    roll -= outcome.weight;
    if (roll < 0) {
      return outcome;
    }
  }
  return slot[0];
}

function matches({ rarity, variants }: PoolCard, { source }: Outcome): boolean {
  return source === REVERSE ? variants.includes(REVERSE) : source.includes(rarity ?? NO_RARITY);
}

// Any version but the reverse, which only reverse outcomes give.
function pickVariant({ variants }: PoolCard, random: Random): string {
  const regular = variants.filter((variant) => variant !== REVERSE);
  return pickOne(regular, random) ?? variants[0] ?? 'normal';
}

export function revealRank(
  { revealOrder }: BoosterRecipe,
  rarity: string | null,
  variant: string,
): number {
  const rank = revealOrder.indexOf(rarity ?? NO_RARITY);
  return variant === REVERSE ? Math.max(rank, revealOrder.indexOf(REVERSE)) : rank;
}

function drawSlots(
  pool: readonly PoolCard[],
  slots: readonly BoosterSlot[],
  recipe: BoosterRecipe,
  random: Random,
): DrawnCard[] | null {
  const drawn: (DrawnCard & { rank: number })[] = [];
  const used = new Set<string>();

  for (const slot of slots) {
    const available = (outcome: Outcome) =>
      pool.filter((card) => !used.has(card.id) && matches(card, outcome));
    // A set without the rolled result gives the slot's usual one instead.
    const outcome = [pickOutcome(slot, random), ...slot].find(
      (candidate) => available(candidate).length > 0,
    );
    const card = outcome && pickOne(available(outcome), random);
    if (!card || !outcome) {
      return null;
    }

    const variant = outcome.source === REVERSE ? REVERSE : pickVariant(card, random);
    used.add(card.id);
    drawn.push({
      cardId: card.id,
      variant,
      rank: revealRank(recipe, card.rarity, variant),
    });
  }

  return drawn
    .sort((first, second) => first.rank - second.rank)
    .map(({ cardId, variant }) => ({ cardId, variant }));
}

// Returns null when the pool can't fill a whole booster. The cards come in their reveal order.
export function drawBooster(
  pool: readonly PoolCard[],
  recipe: BoosterRecipe,
  random: Random = Math.random,
): DrawnCard[] | null {
  return drawSlots(pool, recipe.slots, recipe, random);
}

export function drawGodPack(
  pool: readonly PoolCard[],
  recipe: BoosterRecipe,
  random: Random = Math.random,
): DrawnCard[] | null {
  const slot = [{ source: recipe.godPackRarities, weight: 1 }];
  return drawSlots(pool, Array(boosterSize(recipe)).fill(slot), recipe, random);
}

// A set too small for a god pack gives a usual booster instead.
export function openBooster(
  pool: readonly PoolCard[],
  recipe: BoosterRecipe,
  random: Random = Math.random,
): { cards: DrawnCard[]; isGodPack: boolean } | null {
  const godPack =
    random() * 100 < GOD_PACK_CHANCE_PERCENT ? drawGodPack(pool, recipe, random) : null;
  if (godPack) {
    return { cards: godPack, isGodPack: true };
  }

  const cards = drawBooster(pool, recipe, random);
  return cards && { cards, isGodPack: false };
}

// The versions of cards that no booster of this recipe could ever give.
export function unreachableSlots(pool: readonly PoolCard[], recipe: BoosterRecipe): string[] {
  const outcomes = recipe.slots.flat();
  return pool.flatMap((card) =>
    card.variants
      .filter(
        (variant) =>
          !outcomes.some(({ source }) =>
            variant === REVERSE
              ? source === REVERSE
              : source !== REVERSE && source.includes(card.rarity ?? NO_RARITY),
          ),
      )
      .map((variant) => `${card.id} (${variant})`),
  );
}

const TEAR_COMPLETE_AT = 0.75;

// How far along the pack's width a drag has gone, from 0 to 1, in either direction.
export function tearProgress(startX: number, currentX: number, packWidth: number): number {
  return Math.min(Math.abs(currentX - startX) / packWidth, 1);
}

export function isTearComplete(progress: number): boolean {
  return progress >= TEAR_COMPLETE_AT;
}
