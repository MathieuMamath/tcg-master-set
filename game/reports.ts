import { isPlayableSet } from './card-sets';
import type { GameEventDetails } from './events';
import { SHOPKEEPER_STOCKS } from './shop-dialogue';

// What the browser reports of how players play, for the statistics only: who they talk to, which
// shop windows they look through, which binders they open, and the boosters they back out of
// before cutting. None of it gives an advantage, so each report is only checked for its shape,
// against the game's own names.

export const SPEAKERS = [
  ...SHOPKEEPER_STOCKS,
  'binderSeller',
  'grandma',
  'grandpa',
  'boy',
  'gaspard',
  'berenice',
  'brutus',
  'hulotte',
  'trotte',
  'ramenChef',
  'dojoMaster',
] as const;

export type Report =
  | { type: 'npc.talked'; details: GameEventDetails['npc.talked'] }
  | { type: 'shop.viewed'; details: GameEventDetails['shop.viewed'] }
  | { type: 'binder.viewed'; details: GameEventDetails['binder.viewed'] }
  | { type: 'booster.abandoned'; details: GameEventDetails['booster.abandoned'] };

export function parseReport(value: unknown): Report | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { type, speaker, stock, setId } = value as Record<string, unknown>;
  switch (type) {
    case 'npc.talked':
      return SPEAKERS.includes(speaker as (typeof SPEAKERS)[number])
        ? { type, details: { speaker: speaker as string } }
        : null;
    case 'shop.viewed':
      return stock === 'binderSeller' || SHOPKEEPER_STOCKS.includes(stock as never)
        ? { type, details: { stock: stock as string } }
        : null;
    case 'binder.viewed':
    case 'booster.abandoned':
      return typeof setId === 'string' && isPlayableSet(setId)
        ? { type, details: { setId } }
        : null;
    default:
      return null;
  }
}
