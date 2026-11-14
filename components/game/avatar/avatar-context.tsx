'use client';

import { createContext, useContext } from 'react';
import { type HatId, type ScarfId, STARTER_LOOK } from '@/game/avatar/items';
import { type AvatarSpecies, DEFAULT_SPECIES } from '@/game/avatar/species';

export type WornLook = { species: AvatarSpecies; scarf: ScarfId | null; hat: HatId | null };

// The animal the player walks about as and what they wear, for everything that draws Pip.
export const AvatarContext = createContext<WornLook>({
  species: DEFAULT_SPECIES,
  scarf: STARTER_LOOK.scarf,
  hat: STARTER_LOOK.hat,
});

export function useWornLook(): WornLook {
  return useContext(AvatarContext);
}
