import { describe, expect, it } from 'vitest';
import { PLAYABLE_SET_IDS } from './card-sets';
import {
  generateCouponCode,
  isCouponExpired,
  normalizeCouponCode,
  parseCouponDraft,
} from './coupons';

const NOW = new Date('2026-11-06T12:00:00Z');
const SET = PLAYABLE_SET_IDS[0];

describe('normalizeCouponCode', () => {
  it('trims a code and puts it in capitals', () => {
    expect(normalizeCouponCode('  bienvenue ')).toBe('BIENVENUE');
    expect(normalizeCouponCode('noel-2026')).toBe('NOEL-2026');
  });

  it('refuses what can not be a code', () => {
    expect(normalizeCouponCode('ab')).toBeNull();
    expect(normalizeCouponCode('with space')).toBeNull();
    expect(normalizeCouponCode('é-accent')).toBeNull();
    expect(normalizeCouponCode(42)).toBeNull();
  });
});

describe('generateCouponCode', () => {
  it('makes a readable code of two groups of four', () => {
    const code = generateCouponCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(normalizeCouponCode(code)).toBe(code);
  });
});

describe('parseCouponDraft', () => {
  it('takes coins, boosters of a set, or both', () => {
    expect(parseCouponDraft({ code: 'gift', coins: 500, boosters: 0 }, NOW)).toEqual({
      draft: { code: 'GIFT', coins: 500, boosterSetId: null, boosters: 0, expiresAt: null },
    });
    const both = parseCouponDraft(
      { code: 'BOTH', coins: 100, boosters: 3, boosterSetId: SET, expiresOn: '2026-12-31' },
      NOW,
    );
    expect(both).toEqual({
      draft: {
        code: 'BOTH',
        coins: 100,
        boosterSetId: SET,
        boosters: 3,
        expiresAt: new Date('2026-12-31T23:59:59.999Z'),
      },
    });
  });

  it('drops the set when no booster is given', () => {
    const draft = parseCouponDraft(
      { code: 'COINS', coins: 10, boosters: 0, boosterSetId: SET },
      NOW,
    );
    expect(draft).toMatchObject({ draft: { boosterSetId: null } });
  });

  it('says what is wrong', () => {
    expect(parseCouponDraft({ code: 'x', coins: 10, boosters: 0 }, NOW)).toEqual({ error: 'code' });
    expect(parseCouponDraft({ code: 'NONE', coins: 0, boosters: 0 }, NOW)).toEqual({
      error: 'reward',
    });
    expect(parseCouponDraft({ code: 'NEG', coins: -5, boosters: 0 }, NOW)).toEqual({
      error: 'coins',
    });
    expect(
      parseCouponDraft({ code: 'LOTS', coins: 0, boosters: 999, boosterSetId: SET }, NOW),
    ).toEqual({
      error: 'boosters',
    });
    expect(parseCouponDraft({ code: 'NOSET', coins: 0, boosters: 2 }, NOW)).toEqual({
      error: 'set',
    });
    expect(
      parseCouponDraft({ code: 'PAST', coins: 5, boosters: 0, expiresOn: '2026-11-05' }, NOW),
    ).toEqual({ error: 'expiry' });
  });

  it('lets a coupon last until the end of the chosen day', () => {
    const today = parseCouponDraft(
      { code: 'TODAY', coins: 5, boosters: 0, expiresOn: '2026-11-06' },
      NOW,
    );
    expect(today).toMatchObject({ draft: { code: 'TODAY' } });
  });
});

describe('isCouponExpired', () => {
  it('only expires a coupon with a date that has passed', () => {
    expect(isCouponExpired(null, NOW)).toBe(false);
    expect(isCouponExpired(new Date('2026-11-07T00:00:00Z'), NOW)).toBe(false);
    expect(isCouponExpired(new Date('2026-11-06T11:59:59Z'), NOW)).toBe(true);
  });
});
