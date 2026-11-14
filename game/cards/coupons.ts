import { isPlayableSet, type SetId } from './card-sets';

// The rules of coupons: their codes, what they may give, and when they stop working. A player uses
// a coupon once, by typing its code in the settings; the server alone checks and pays it.

export const MAX_COUPON_COINS = 100_000;
export const MAX_COUPON_BOOSTERS = 50;
const CODE = /^[A-Z0-9-]{3,24}$/;
// Letters and digits that can't be mistaken for one another when read aloud or copied by hand.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// A code as stored and compared: trimmed and in capitals. Null when it can't be a code.
export function normalizeCouponCode(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const code = value.trim().toUpperCase();
  return CODE.test(code) ? code : null;
}

export function generateCouponCode(random: () => number = Math.random): string {
  const pick = () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)] ?? 'A';
  return `${Array.from({ length: 4 }, pick).join('')}-${Array.from({ length: 4 }, pick).join('')}`;
}

export type CouponDraft = {
  code: string;
  coins: number;
  boosterSetId: SetId | null;
  boosters: number;
  // The end of the chosen day, in UTC, or null for a coupon that never expires.
  expiresAt: Date | null;
};

export type CouponDraftError = 'code' | 'coins' | 'boosters' | 'set' | 'reward' | 'expiry';

const wholeBetween = (value: unknown, max: number) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;

// What an admin asked for on Mlle Trotte's form, checked: a code, coins and boosters within reason,
// a set for the boosters, at least one of the two, and an expiry day still to come.
export function parseCouponDraft(
  value: unknown,
  now: Date,
): { draft: CouponDraft } | { error: CouponDraftError } {
  if (typeof value !== 'object' || value === null) {
    return { error: 'code' };
  }
  const {
    code: rawCode,
    coins,
    boosters,
    boosterSetId,
    expiresOn,
  } = value as Record<string, unknown>;
  const code = normalizeCouponCode(rawCode);
  if (!code) {
    return { error: 'code' };
  }
  if (!wholeBetween(coins, MAX_COUPON_COINS)) {
    return { error: 'coins' };
  }
  if (!wholeBetween(boosters, MAX_COUPON_BOOSTERS)) {
    return { error: 'boosters' };
  }
  const boosterCount = boosters as number;
  if (boosterCount > 0 && !(typeof boosterSetId === 'string' && isPlayableSet(boosterSetId))) {
    return { error: 'set' };
  }
  if ((coins as number) === 0 && boosterCount === 0) {
    return { error: 'reward' };
  }
  let expiresAt: Date | null = null;
  if (expiresOn !== null && expiresOn !== undefined && expiresOn !== '') {
    if (typeof expiresOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) {
      return { error: 'expiry' };
    }
    expiresAt = new Date(`${expiresOn}T23:59:59.999Z`);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= now) {
      return { error: 'expiry' };
    }
  }
  return {
    draft: {
      code,
      coins: coins as number,
      boosterSetId: boosterCount > 0 ? (boosterSetId as SetId) : null,
      boosters: boosterCount,
      expiresAt,
    },
  };
}

export function isCouponExpired(expiresAt: Date | null, now: Date): boolean {
  return expiresAt !== null && expiresAt <= now;
}

// An admin's request to turn a coupon off or back on, checked for its shape.
export function parseCouponActivation(
  value: unknown,
): { couponId: number; isActive: boolean } | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { couponId, isActive } = value as Record<string, unknown>;
  return typeof couponId === 'number' &&
    Number.isInteger(couponId) &&
    couponId > 0 &&
    typeof isActive === 'boolean'
    ? { couponId, isActive }
    : null;
}
