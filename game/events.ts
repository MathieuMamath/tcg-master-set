// The game's event log: every action that changes what a player has is recorded, so that the
// game's statistics can be worked out by day, week or month, here and in tools of its own.
//
// The catalogue is a contract with whatever reads the log. A type's name and the fields of its
// details never change once recorded: a new need gets a new field or a new type, so that past
// events keep their meaning. Details hold no personal data, only the game's own ids and numbers.

export type GameEventDetails = {
  // A player created an account, or signed in to one.
  'player.signed_up': Record<string, never>;
  'player.signed_in': Record<string, never>;
  // Coins spent at the bookshop and the shop.
  'binder.bought': { setId: string; coins: number; coinsAfter?: number };
  'booster.bought': { setId: string; quantity: number; coins: number; coinsAfter?: number };
  // A pack cut open: its best pull tier, how many cards were new, and what its duplicates paid.
  'booster.opened': {
    setId: string;
    isGodPack: boolean;
    bestTier: number;
    newCards: number;
    duplicateCoins: number;
    // The ten cards drawn, each with its version, for checking the draws against the recipes.
    // Only recorded from November 2026: older openings don't have it.
    cards?: { cardId: string; variant: string }[];
    coinsAfter?: number;
  };
  // An attempt at a daily quest began. The raffle has no attempt, only its draw.
  'quest.started': { questId: string };
  // An attempt ended, won or lost: what it gave, and the quest's own measure of how it went.
  'quest.finished': {
    questId: string;
    outcome: string;
    coins: number;
    boosterSetId: string | null;
    // Only for the quests that have them.
    score?: number;
    moves?: number;
    shape?: string;
    item?: string;
    // The stars a shift at the ramen shop earned, from 0 to 3, by the thresholds of the day.
    stars?: number;
    coinsAfter?: number;
  };
  // The server refused to finish an attempt: out of time, or with moves that can't have happened.
  'quest.rejected': { questId: string };
  'daily_bonus.claimed': { coins: number; coinsAfter?: number };
  // The player arrived in a place, through a door or by bus, and where from: null on a first visit.
  // Reported by the browser when it saves where the character stands, and not checked, since a
  // place gives no advantage.
  'place.entered': { place: string; from: string | null };
  // The game's page was opened: in which language, on what kind of device, and from which domain
  // the link came, null when typed in or from the game itself. Reported by the browser.
  'game.opened': { locale: string; device: 'desktop' | 'phone'; referrer: string | null };
  // The page was left, and how long it had been open, counted by the server from its opening.
  'game.left': { seconds: number };
  // How players play, reported by the browser for the statistics: a conversation with a character,
  // by their id, a seller's shop window looked through, by her stock, a binder opened, and a
  // booster taken out of the bag then put back before it was cut.
  'npc.talked': { speaker: string };
  'shop.viewed': { stock: string };
  'binder.viewed': { setId: string };
  'booster.abandoned': { setId: string };
  // Pip went to bed, at this minute of the game's day, and woke up in the morning.
  'player.slept': { minute: number };
  // An admin made a coupon on Mlle Trotte's floor: what it gives, and until when.
  'coupon.created': {
    couponId: number;
    code: string;
    coins: number;
    boosterSetId: string | null;
    boosters: number;
    expiresAt: string | null;
  };
  // A player used a coupon from the settings, and what it gave them.
  'coupon.redeemed': {
    couponId: number;
    code: string;
    coins: number;
    boosterSetId: string | null;
    boosters: number;
    coinsAfter: number;
  };
};

// Every event that changes a player's coins also carries `coinsAfter`, their coins once it was
// done, recorded from November 2026: older events don't have it.

export type GameEventType = keyof GameEventDetails;

// Every type, for whatever lists them, such as a check that each one is ever recorded.
export const GAME_EVENT_TYPES = [
  'player.signed_up',
  'player.signed_in',
  'binder.bought',
  'booster.bought',
  'booster.opened',
  'quest.started',
  'quest.finished',
  'quest.rejected',
  'daily_bonus.claimed',
  'place.entered',
  'game.opened',
  'game.left',
  'npc.talked',
  'shop.viewed',
  'binder.viewed',
  'booster.abandoned',
  'player.slept',
  'coupon.created',
  'coupon.redeemed',
] as const satisfies readonly GameEventType[];

export type GameEvent = {
  [Type in GameEventType]: { type: Type; details: GameEventDetails[Type] };
}[GameEventType];

export function isGameEventType(value: string): value is GameEventType {
  return (GAME_EVENT_TYPES as readonly string[]).includes(value);
}
