import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

// Coupons made by admins on Mlle Trotte's floor: each gives coins, boosters of a set, or both, to
// every player who types its code in the settings, once each, until it expires if it does, or
// until an admin deactivates it. A deactivated coupon is kept, with its uses, and can be turned
// back on.
export const coupons = pgTable(
  'coupons',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    // In capitals, as players may type it in any case.
    code: text('code').notNull(),
    coins: integer('coins').notNull().default(0),
    boosterSetId: text('booster_set_id'),
    boosters: integer('boosters').notNull().default(0),
    // Null for a coupon that never expires.
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    // Null while the coupon can be used.
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('coupons_code_idx').on(table.code),
    check('coupons_coins_not_negative', sql`${table.coins} >= 0`),
    check('coupons_boosters_not_negative', sql`${table.boosters} >= 0`),
    check('coupons_give_something', sql`${table.coins} > 0 or ${table.boosters} > 0`),
    check(
      'coupons_boosters_have_a_set',
      sql`(${table.boosters} = 0) = (${table.boosterSetId} is null)`,
    ),
  ],
);

// Who used which coupon, so that each player uses each one only once.
export const couponRedemptions = pgTable(
  'coupon_redemptions',
  {
    couponId: integer('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.couponId, table.userId] })],
);
