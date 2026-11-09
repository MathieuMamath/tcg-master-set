// Using a coupon from the settings, once per player.

import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { couponRedemptions, coupons, playerBoosters, playerWallets } from '@/db/schema';
import { isPlayableSet, type SetId } from '@/game/cards/card-sets';
import { isCouponExpired, normalizeCouponCode } from '@/game/cards/coupons';
import type { Wallet } from '@/game/cards/shop-dialogue';
import { recordEvent } from './events';
import { coinsNow, loadWallet } from './wallet';

export type CouponRedemption =
  | {
      status: 'redeemed';
      coins: number;
      boosterSetId: SetId | null;
      boosters: number;
      wallet: Wallet;
    }
  | { status: 'unknown' | 'expired' | 'alreadyUsed' };

// A player types a coupon's code in the settings: the server finds it, checks it hasn't expired
// and that this player hasn't used it yet, and pays it, all in one transaction, so that it can
// never be used twice.
export async function redeemCoupon(
  userId: string,
  typedCode: string,
  now = new Date(),
): Promise<CouponRedemption> {
  const code = normalizeCouponCode(typedCode);
  if (!code) {
    return { status: 'unknown' };
  }
  return getDb().transaction(async (transaction) => {
    const [coupon] = await transaction.select().from(coupons).where(eq(coupons.code, code));
    if (!coupon) {
      return { status: 'unknown' as const };
    }
    if (isCouponExpired(coupon.expiresAt, now)) {
      return { status: 'expired' as const };
    }
    const [used] = await transaction
      .insert(couponRedemptions)
      .values({ couponId: coupon.id, userId, redeemedAt: now })
      .onConflictDoNothing()
      .returning({ couponId: couponRedemptions.couponId });
    if (!used) {
      return { status: 'alreadyUsed' as const };
    }
    await loadWallet(transaction, userId);
    if (coupon.coins > 0) {
      await transaction
        .update(playerWallets)
        .set({ coins: sql`${playerWallets.coins} + ${coupon.coins}`, updatedAt: now })
        .where(eq(playerWallets.userId, userId));
    }
    const boosterSetId =
      coupon.boosters > 0 && isPlayableSet(coupon.boosterSetId) ? coupon.boosterSetId : null;
    if (boosterSetId) {
      await transaction
        .insert(playerBoosters)
        .values({ userId, setId: boosterSetId, count: coupon.boosters })
        .onConflictDoUpdate({
          target: [playerBoosters.userId, playerBoosters.setId],
          set: { count: sql`${playerBoosters.count} + ${coupon.boosters}` },
        });
    }
    await recordEvent(transaction, userId, 'coupon.redeemed', {
      couponId: coupon.id,
      code: coupon.code,
      coins: coupon.coins,
      boosterSetId,
      boosters: boosterSetId ? coupon.boosters : 0,
      coinsAfter: await coinsNow(transaction, userId),
    });
    return {
      status: 'redeemed' as const,
      coins: coupon.coins,
      boosterSetId,
      boosters: boosterSetId ? coupon.boosters : 0,
      wallet: await loadWallet(transaction, userId),
    };
  });
}
