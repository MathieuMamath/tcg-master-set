// How exciting a card or a pack is, from 0 to 5. Only a god pack reaches the top tier, and the
// opening climbs one stage at a time up to the tier of the pack.
export type PullTier = 0 | 1 | 2 | 3 | 4 | 5;

const GOD_PACK_TIER = 5;

const RARITY_TIERS: Record<string, PullTier> = {
  'Double rare': 1,
  'Holo Rare V': 1,
  'Holo Rare VMAX': 1,
  'Ultra Rare': 2,
  'Illustration rare': 2,
  'Special illustration rare': 3,
  'Secret Rare': 3,
  'Mega Attack Rare': 4,
  'Black White Rare': 4,
  'Hyper rare': 4,
  'Mega Hyper Rare': 4,
  'RGB Rare': 4,
  'Futuristic Rare': 4,
};

// Any other rarity is what most boosters hold, so it gets the plain opening.
export function cardTier(rarity: string | null): PullTier {
  return rarity !== null && Object.hasOwn(RARITY_TIERS, rarity) ? RARITY_TIERS[rarity] : 0;
}

export function packTier(tiers: readonly PullTier[], isGodPack: boolean): PullTier {
  return isGodPack ? GOD_PACK_TIER : (Math.max(0, ...tiers) as PullTier);
}

const STAGE_MILLISECONDS = 650;
const STILL_STAGE_MILLISECONDS = 250;

export function stageDuration(isStill: boolean): number {
  return isStill ? STILL_STAGE_MILLISECONDS : STAGE_MILLISECONDS;
}

// Every opening has a first stage, so the plainest pack still gets a short moment of its own.
export function stageCount(tier: PullTier): number {
  return tier + 1;
}
