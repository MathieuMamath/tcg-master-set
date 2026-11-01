// The sets the game plays with, newest first. Their cards come from `pnpm cards:import`.
export const PLAYABLE_SET_IDS = [
  '30th',
  'me05',
  'me04',
  'me03',
  'me02.5',
  'me02',
  'me01',
  'sv10.5w',
  'sv10.5b',
  'sv10',
  'sv09',
  'swsh3',
] as const;

export type SetId = (typeof PLAYABLE_SET_IDS)[number];

export type PlayableSet = { id: SetId; name: string; logoUrl: string | null; slotTotal: number };

export function isPlayableSet(id: string | null): id is SetId {
  return PLAYABLE_SET_IDS.some((playable) => playable === id);
}
