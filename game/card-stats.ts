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

// One version's line in the full export of the card statistics.
export type CardStatsRow = {
  setId: string;
  setName: string;
  // The set's boosters that recorded their cards, and the god packs among them.
  boosters: number;
  godPacks: number;
  cardId: string;
  number: string;
  name: string;
  // In English, as the recipes read it.
  rarity: string | null;
  variant: string;
  pulls: number;
  // Per booster: what came out, and what the recipe gives.
  observed: number | null;
  expected: number | null;
};

const CSV_COLUMNS = [
  'set_id',
  'set_name',
  'boosters',
  'god_packs',
  'card_id',
  'number',
  'name',
  'rarity',
  'variant',
  'pulls',
  'observed_per_1000',
  'expected_per_1000',
  'observed_vs_expected',
] as const;

function csvCell(value: string | number | null): string {
  if (value === null) {
    return '';
  }
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function perThousand(rate: number | null): string | null {
  return rate === null ? null : (rate * 1000).toFixed(3);
}

// The export as CSV, one line a version, for a spreadsheet: rates per thousand boosters, and how
// the observed rate compares with the expected one, 1 being exactly as the recipe says.
export function cardStatsCsv(rows: readonly CardStatsRow[]): string {
  const lines = rows.map((row) =>
    [
      row.setId,
      row.setName,
      row.boosters,
      row.godPacks,
      row.cardId,
      row.number,
      row.name,
      row.rarity,
      row.variant,
      row.pulls,
      perThousand(row.observed),
      perThousand(row.expected),
      row.observed !== null && row.expected ? (row.observed / row.expected).toFixed(3) : null,
    ]
      .map(csvCell)
      .join(','),
  );
  return `${[CSV_COLUMNS.join(','), ...lines].join('\n')}\n`;
}
