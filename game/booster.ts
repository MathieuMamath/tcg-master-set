import type { SetId } from './card-sets';

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

export const BOOSTER_RECIPES: Record<SetId, BoosterRecipe> = {
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
};

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
  return source === REVERSE
    ? variants.includes(REVERSE)
    : rarity !== null && source.includes(rarity);
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
  const rank = rarity === null ? -1 : revealOrder.indexOf(rarity);
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
              : source !== REVERSE && card.rarity !== null && source.includes(card.rarity),
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
