import { count, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { couponRedemptions, coupons } from '@/db/schema';
import type { CouponDraft } from '@/game/cards/coupons';
import { recordEvent } from '@/player/events';

// Mlle Trotte's register: the coupons admins made, and how many players used each. Only counts
// leave this module, never who used a coupon.

export type CouponSummary = {
  id: number;
  code: string;
  coins: number;
  boosterSetId: string | null;
  boosters: number;
  expiresAt: string | null;
  createdAt: string;
  redemptions: number;
};

export async function listCoupons(): Promise<CouponSummary[]> {
  const rows = await getDb()
    .select({
      id: coupons.id,
      code: coupons.code,
      coins: coupons.coins,
      boosterSetId: coupons.boosterSetId,
      boosters: coupons.boosters,
      expiresAt: coupons.expiresAt,
      createdAt: coupons.createdAt,
      redemptions: count(couponRedemptions.userId),
    })
    .from(coupons)
    .leftJoin(couponRedemptions, eq(couponRedemptions.couponId, coupons.id))
    .groupBy(coupons.id)
    .orderBy(desc(coupons.createdAt));
  return rows.map((row) => ({
    ...row,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    redemptions: Number(row.redemptions),
  }));
}

// Makes a coupon, unless its code is already taken. Returns false then.
export async function createCoupon(adminId: string, draft: CouponDraft): Promise<boolean> {
  return getDb().transaction(async (transaction) => {
    const [created] = await transaction
      .insert(coupons)
      .values({ ...draft, createdBy: adminId })
      .onConflictDoNothing()
      .returning({ id: coupons.id });
    if (!created) {
      return false;
    }
    await recordEvent(transaction, adminId, 'coupon.created', {
      couponId: created.id,
      code: draft.code,
      coins: draft.coins,
      boosterSetId: draft.boosterSetId,
      boosters: draft.boosters,
      expiresAt: draft.expiresAt ? draft.expiresAt.toISOString() : null,
    });
    return true;
  });
}
