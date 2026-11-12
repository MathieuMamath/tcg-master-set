export const SLOTS_PER_PAGE = 9;

const VARIANT_ORDER = ['normal', 'firstEdition', 'holo', 'reverse', 'wPromo'];

// How many copies the player owns, by slot key.
export type Collection = Readonly<Record<string, number>>;

export type BinderCard = {
  id: string;
  localId: string;
  name: string;
  rarity: string | null;
  imageUrl: string | null;
  variants: readonly string[];
};

export type BinderSlot = {
  key: string;
  card: BinderCard;
  variant: string;
};

export function slotKey(cardId: string, variant: string): string {
  return `${cardId}:${variant}`;
}

// In number order, so that card 10 comes after card 2.
function compareLocalIds(a: string, b: string): number {
  return a.localeCompare(b, 'en', { numeric: true });
}

function variantRank(variant: string): number {
  const rank = VARIANT_ORDER.indexOf(variant);
  return rank === -1 ? VARIANT_ORDER.length : rank;
}

// A master set has one slot per variant of each card.
export function binderSlots(cards: readonly BinderCard[]): BinderSlot[] {
  return [...cards]
    .sort((a, b) => compareLocalIds(a.localId, b.localId))
    .flatMap((card) =>
      [...card.variants]
        .sort((a, b) => variantRank(a) - variantRank(b))
        .map((variant) => ({ key: slotKey(card.id, variant), card, variant })),
    );
}

export function pageCount(slotTotal: number): number {
  return Math.max(Math.ceil(slotTotal / SLOTS_PER_PAGE), 1);
}

export function slotsOnPage<Slot>(slots: readonly Slot[], page: number): Slot[] {
  return slots.slice(page * SLOTS_PER_PAGE, (page + 1) * SLOTS_PER_PAGE);
}

export function clampPage(page: number, slotTotal: number): number {
  return Math.min(Math.max(page, 0), pageCount(slotTotal) - 1);
}

// The pages on show when the binder displays this many at once, side by side.
export function pagesShown(page: number, slotTotal: number, pagesAtOnce: number): number[] {
  const first = page - (page % pagesAtOnce);
  return Array.from({ length: pagesAtOnce }, (_, index) => first + index).filter(
    (shown) => shown < pageCount(slotTotal),
  );
}

// The page to turn to, or the same page when the binder's end leaves nothing to turn: the last
// spread of a binder with an even number of pages ends on its right page, which clamping alone
// would turn to while it is already on show.
export function turnPage(
  page: number,
  direction: -1 | 1,
  slotTotal: number,
  pagesAtOnce: number,
): number {
  const [first] = pagesShown(page, slotTotal, pagesAtOnce);
  return goToPage(page, first + direction * pagesAtOnce, slotTotal, pagesAtOnce);
}

// The page to show for a page asked for, such as the first, the last or one picked by its number:
// the first page of its spread, or the same page when that spread is already on show.
export function goToPage(
  page: number,
  target: number,
  slotTotal: number,
  pagesAtOnce: number,
): number {
  const [first] = pagesShown(page, slotTotal, pagesAtOnce);
  const [targetFirst] = pagesShown(clampPage(target, slotTotal), slotTotal, pagesAtOnce);
  return targetFirst === first ? page : targetFirst;
}

// What can be turned to at once: every page on a narrow screen, every spread on a wide one, each
// with its first and last pages.
export function pageChoices(
  slotTotal: number,
  pagesAtOnce: number,
): { first: number; last: number }[] {
  return Array.from({ length: Math.ceil(pageCount(slotTotal) / pagesAtOnce) }, (_, index) => {
    const shown = pagesShown(index * pagesAtOnce, slotTotal, pagesAtOnce);
    return { first: shown[0], last: shown[shown.length - 1] };
  });
}

export function ownedSlotCount(slots: readonly BinderSlot[], collection: Collection): number {
  return slots.filter(({ key }) => (collection[key] ?? 0) > 0).length;
}

// Card ids start with their set's id, and the collection only stores what the player owns.
export function ownedInSet(collection: Collection, setId: string): number {
  return Object.keys(collection).filter((key) => key.startsWith(`${setId}-`)).length;
}

// The binders the player can open come first, then each group goes from newest to oldest.
export function bindersToChoose<Set extends { id: string; releaseDate: string }>(
  sets: readonly Set[],
  collection: Collection,
): (Set & { owned: number })[] {
  return sets
    .map((set) => ({ ...set, owned: ownedInSet(collection, set.id) }))
    .sort(
      (a, b) =>
        Number(b.owned > 0) - Number(a.owned > 0) || b.releaseDate.localeCompare(a.releaseDate),
    );
}

export function addToCollection(
  collection: Collection,
  cards: readonly { id: string; variant: string }[],
): Collection {
  const next = { ...collection };
  for (const { id, variant } of cards) {
    const key = slotKey(id, variant);
    next[key] = (next[key] ?? 0) + 1;
  }
  return next;
}

// From the copies counted once a booster is added: a count of one means it wasn't owned before.
export function firstCopies(
  added: readonly { cardId: string; variant: string; count: number }[],
): Set<string> {
  return new Set(
    added.filter(({ count }) => count === 1).map(({ cardId, variant }) => slotKey(cardId, variant)),
  );
}
