'use client';

import { createContext, useContext } from 'react';

// The player's username, which the characters call them by. Pip is only the avatar's look: no
// text ever names the player Pip.
export const PlayerNameContext = createContext('');

export function usePlayerName(): string {
  return useContext(PlayerNameContext);
}
