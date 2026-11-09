import type { ShopkeeperStock } from '@/game/cards/shop-dialogue';
import { isDoorInteraction } from '@/game/world/side-rooms';
import type { Interaction, QuestGiver } from '@/game/world/world';
import type { ShiftHost } from './shifts/shift';
import type { Speaker } from './shop/npc-dialog';

// Whoever the player can be talking to. Papy Caillou and Bérénice are both quest givers and the
// hosts of a shift, a conversation of its own that opens straight onto the game.
export type Talk =
  | ShopkeeperStock
  | 'binderSeller'
  | QuestGiver
  // Mme Ronron's kitten only speaks once found, never from the street.
  | Exclude<Speaker, 'kitten'>
  | ShiftHost
  | 'grandpaStones'
  | 'bereniceBalloons';

// Talking to someone gets a speech bubble over their head, and everything else a prompt at the
// bottom of the screen.
export function isTalk(interaction: Interaction): interaction is Extract<Talk, Interaction> {
  return (
    !isDoorInteraction(interaction) &&
    interaction !== 'binder' &&
    interaction !== 'basketball' &&
    interaction !== 'scrub' &&
    interaction !== 'busStop' &&
    interaction !== 'elevator' &&
    interaction !== 'bed' &&
    interaction !== 'search'
  );
}
