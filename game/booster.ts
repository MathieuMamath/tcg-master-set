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

const COMMON_SLOTS = 5;
const UNCOMMON_SLOTS = 3;
const REVERSE_SLOTS = 1;

export const BOOSTER_SIZE = COMMON_SLOTS + UNCOMMON_SLOTS + REVERSE_SLOTS + 1;

// The last slot, from the most common result to the rarest. Each weight is out of 100.
const RARE_SLOT_ODDS = [
  { rarity: 'Rare', weight: 62 },
  { rarity: 'Holo Rare', weight: 20 },
  { rarity: 'Holo Rare V', weight: 9 },
  { rarity: 'Holo Rare VMAX', weight: 4 },
  { rarity: 'Ultra Rare', weight: 3 },
  { rarity: 'Secret Rare', weight: 2 },
];

const RARE_SLOT_RARITIES = RARE_SLOT_ODDS.map(({ rarity }) => rarity);

type Random = () => number;

function pickOne<Card>(cards: readonly Card[], random: Random): Card | undefined {
  return cards[Math.floor(random() * cards.length)];
}

function pickRareRarity(random: Random): string {
  let roll = random() * 100;
  for (const { rarity, weight } of RARE_SLOT_ODDS) {
    roll -= weight;
    if (roll < 0) {
      return rarity;
    }
  }
  return RARE_SLOT_ODDS[0].rarity;
}

function baseVariant(card: PoolCard): string {
  return card.variants.includes('normal') ? 'normal' : (card.variants[0] ?? 'normal');
}

// Returns null when the pool can't fill a whole booster.
export function drawBooster(
  pool: readonly PoolCard[],
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
  const withRarity = (rarity: string) => pool.filter((card) => card.rarity === rarity);

  for (let slot = 0; slot < COMMON_SLOTS; slot++) {
    draw(withRarity('Common'), baseVariant);
  }
  for (let slot = 0; slot < UNCOMMON_SLOTS; slot++) {
    draw(withRarity('Uncommon'), baseVariant);
  }
  for (let slot = 0; slot < REVERSE_SLOTS; slot++) {
    draw(
      pool.filter(({ variants }) => variants.includes('reverse')),
      () => 'reverse',
    );
  }

  // A set without the rarity that was rolled falls back on any card of the rare slot.
  const rolled = withRarity(pickRareRarity(random));
  draw(
    rolled.length > 0
      ? rolled
      : pool.filter(({ rarity }) => rarity !== null && RARE_SLOT_RARITIES.includes(rarity)),
    baseVariant,
  );

  return drawn.length === BOOSTER_SIZE ? drawn : null;
}

const TEAR_COMPLETE_AT = 0.75;

// How far along the pack's width a drag has gone, from 0 to 1, in either direction.
export function tearProgress(startX: number, currentX: number, packWidth: number): number {
  return Math.min(Math.abs(currentX - startX) / packWidth, 1);
}

export function isTearComplete(progress: number): boolean {
  return progress >= TEAR_COMPLETE_AT;
}
