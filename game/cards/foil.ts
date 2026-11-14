// The light a card version catches, as on the real cards: a holo's rainbow foil covers only its
// illustration's window, a reverse's covers everything but it, and the other special versions,
// such as first editions and promos, only get a passing shine. Plain cards catch none. On a card
// whose illustration fills it, such as an ex or an illustration rare, a holo's foil covers it all.
export type Foil = 'holo' | 'fullArt' | 'reverse' | 'shine';

// The rarities, in English, whose illustration covers the whole card rather than a window: the
// ex, V, VMAX and VSTAR of their eras, full-art trainers, and the illustration, ultra, secret and
// gold rarities above them.
const FULL_ART_RARITIES = new Set([
  'Double rare',
  'Holo Rare V',
  'Holo Rare VMAX',
  'Holo Rare VSTAR',
  'Full Art Trainer',
  'Ultra Rare',
  'Illustration rare',
  'Special illustration rare',
  'Secret Rare',
  'Hyper rare',
  'Shiny Ultra Rare',
  'Shiny rare V',
  'Shiny rare VMAX',
  'Mega Attack Rare',
  'Mega Hyper Rare',
  'Black White Rare',
  'RGB Rare',
  'Futuristic Rare',
]);

export function isFullArtRarity(englishRarity: string | null): boolean {
  return englishRarity !== null && FULL_ART_RARITIES.has(englishRarity);
}

export function cardFoil(variant: string, isFullArt = false): Foil | null {
  if (variant === 'normal') {
    return null;
  }
  if (variant === 'holo') {
    return isFullArt ? 'fullArt' : 'holo';
  }
  if (variant === 'reverse') {
    return 'reverse';
  }
  return 'shine';
}
