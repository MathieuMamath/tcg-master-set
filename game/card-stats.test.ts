import { describe, expect, it } from 'vitest';
import type { BinderCard } from './binder';
import { cardDrops, dropRate } from './card-stats';

const card = (id: string, localId: string, variants: string[]): BinderCard => ({
  id,
  localId,
  name: `Placeholder ${localId}`,
  rarity: 'Common',
  imageUrl: null,
  variants,
});

describe('dropRate', () => {
  it('is the pulls per booster opened', () => {
    expect(dropRate(5, 20)).toBe(0.25);
    expect(dropRate(30, 20)).toBe(1.5);
  });

  it('has no rate for a version that never came out, or without any booster', () => {
    expect(dropRate(0, 20)).toBeNull();
    expect(dropRate(3, 0)).toBeNull();
  });
});

describe('cardDrops', () => {
  const cards = [card('set-10', '10', ['normal', 'reverse']), card('set-2', '2', ['normal'])];

  it('lists every version in binder order, with its pulls and rate', () => {
    const drops = cardDrops(
      cards,
      [
        { cardId: 'set-10', variant: 'reverse', pulls: 2 },
        { cardId: 'set-2', variant: 'normal', pulls: 8 },
      ],
      10,
    );
    expect(drops.map(({ key, pulls, rate }) => [key, pulls, rate])).toEqual([
      ['set-2:normal', 8, 0.8],
      ['set-10:normal', 0, null],
      ['set-10:reverse', 2, 0.2],
    ]);
  });

  it('ignores pulls of versions the catalogue no longer has', () => {
    const drops = cardDrops(cards, [{ cardId: 'gone', variant: 'normal', pulls: 4 }], 10);
    expect(drops.every(({ pulls }) => pulls === 0)).toBe(true);
  });
});
