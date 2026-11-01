// The sets the game plays with. Their cards come from `pnpm cards:import`.
export const PLAYABLE_SET_IDS = ['swsh3', '30th'] as const;

export type SetId = (typeof PLAYABLE_SET_IDS)[number];

export type PlayableSet = { id: SetId; name: string; logoUrl: string | null; slotTotal: number };

export function isPlayableSet(id: string | null): id is SetId {
  return PLAYABLE_SET_IDS.some((playable) => playable === id);
}
