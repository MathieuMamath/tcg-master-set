'use client';

import { createContext, useContext } from 'react';
import { type AvatarSpecies, DEFAULT_SPECIES } from '@/game/avatar/species';

// The animal the player walks about as, for everything that draws Pip.
export const AvatarContext = createContext<AvatarSpecies>(DEFAULT_SPECIES);

export function useAvatarSpecies(): AvatarSpecies {
  return useContext(AvatarContext);
}
