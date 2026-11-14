// The animal the player walks about as. Every one keeps Pip's shape, scarf and satchel, so that
// what is worn later fits them all: only the ears, the colours and a few features change.
export const AVATAR_SPECIES = [
  'fox',
  'turtle',
  'dog',
  'cat',
  'rabbit',
  'bear',
  'wolf',
  'gorilla',
  'redPanda',
  'penguin',
] as const;

export type AvatarSpecies = (typeof AVATAR_SPECIES)[number];

// The fox everyone starts as.
export const DEFAULT_SPECIES: AvatarSpecies = 'fox';

export function isAvatarSpecies(value: unknown): value is AvatarSpecies {
  return AVATAR_SPECIES.some((species) => species === value);
}

// A change sent from the mirror, checked for its shape. Every animal is free for now, so any
// known one can be worn.
export function parseAvatarChange(value: unknown): AvatarSpecies | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { species } = value as Record<string, unknown>;
  return isAvatarSpecies(species) ? species : null;
}
