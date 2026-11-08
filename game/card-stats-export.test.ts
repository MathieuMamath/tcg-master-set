import { describe, expect, test } from 'vitest';
import { type CardStatsRow, cardStatsCsv } from './card-stats';

const ROW: CardStatsRow = {
  setId: 'placeholder-set',
  setName: 'Placeholder, "First" Set',
  boosters: 2000,
  godPacks: 1,
  cardId: 'placeholder-set-001',
  number: '001',
  name: 'Placeholder Card',
  rarity: 'Double rare',
  variant: 'holo',
  pulls: 30,
  observed: 0.015,
  expected: 0.0125,
};

describe('the card statistics export', () => {
  test('has a header, then one line a version, rates per thousand boosters', () => {
    const [header, line, end] = cardStatsCsv([ROW]).split('\n');
    expect(header).toBe(
      'set_id,set_name,boosters,god_packs,card_id,number,name,rarity,variant,pulls,observed_per_1000,expected_per_1000,observed_vs_expected',
    );
    expect(line).toBe(
      'placeholder-set,"Placeholder, ""First"" Set",2000,1,placeholder-set-001,001,Placeholder Card,Double rare,holo,30,15.000,12.500,1.200',
    );
    expect(end).toBe('');
  });

  test('leaves the rates empty for a version that never came out or has no expected rate', () => {
    const line = cardStatsCsv([{ ...ROW, pulls: 0, observed: null, expected: null }]).split(
      '\n',
    )[1];
    expect(line.endsWith(',0,,,')).toBe(true);
  });
});
