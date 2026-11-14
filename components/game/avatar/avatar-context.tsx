'use client';

import { createContext, useContext } from 'react';
import { type GearId, type HatId, type ScarfId, STARTER_LOOK } from '@/game/avatar/items';
import { type AvatarSpecies, DEFAULT_SPECIES } from '@/game/avatar/species';

export type WornLook = {
  species: AvatarSpecies;
  scarf: ScarfId | null;
  hat: HatId | null;
  gear: GearId | null;
};

// The animal the player walks about as and what they wear, for everything that draws Pip.
export const AvatarContext = createContext<WornLook>({
  species: DEFAULT_SPECIES,
  scarf: STARTER_LOOK.scarf,
  hat: STARTER_LOOK.hat,
  gear: STARTER_LOOK.gear,
});

export function useWornLook(): WornLook {
  return useContext(AvatarContext);
}
