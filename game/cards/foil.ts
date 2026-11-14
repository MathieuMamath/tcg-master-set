// The light a card version catches, as on the real cards: a holo's rainbow foil covers only its
// illustration, a reverse's covers everything but it, and the other special versions, such as
// first editions and promos, only get a passing shine. Plain cards catch none.
export type Foil = 'holo' | 'reverse' | 'shine';

export function cardFoil(variant: string): Foil | null {
  if (variant === 'normal') {
    return null;
  }
  if (variant === 'holo' || variant === 'reverse') {
    return variant;
  }
  return 'shine';
}
