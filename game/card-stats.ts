import { type BinderCard, binderSlots, slotKey } from './binder';

// How often each version of a set's cards came out of its boosters, to check the draws against the
// recipes. Counted over every opening that recorded its cards, across all players.

export type CardPulls = { cardId: string; variant: string; pulls: number };

export type CardDrop = {
  key: string;
  card: BinderCard;
  variant: string;
  pulls: number;
  // The share of the set's boosters that held this version, or null while it has never come out.
  rate: number | null;
};

// A version's rate: how many times it came out, per booster opened. A version can come out more
// than once in a booster, so the rate can go past one.
export function dropRate(pulls: number, boosters: number): number | null {
  return pulls > 0 && boosters > 0 ? pulls / boosters : null;
}

// Every version of the set, in binder order, with how often it came out.
export function cardDrops(
  cards: readonly BinderCard[],
  pulls: readonly CardPulls[],
  boosters: number,
): CardDrop[] {
  const counts = new Map(
    pulls.map(({ cardId, variant, pulls: count }) => [slotKey(cardId, variant), count]),
  );
  return binderSlots(cards).map(({ key, card, variant }) => {
    const count = counts.get(key) ?? 0;
    return { key, card, variant, pulls: count, rate: dropRate(count, boosters) };
  });
}
