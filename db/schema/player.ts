import { sql } from 'drizzle-orm';
import { check, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { cardSets } from './cards';

// What each player owns. The server is the only one to write here.

export const playerWallets = pgTable(
  'player_wallets',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    coins: integer('coins').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('player_wallets_coins_not_negative', sql`${table.coins} >= 0`)],
);

export const playerBoosters = pgTable(
  'player_boosters',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    setId: text('set_id')
      .notNull()
      .references(() => cardSets.id),
    count: integer('count').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.setId] }),
    check('player_boosters_count_not_negative', sql`${table.count} >= 0`),
  ],
);

export const playerCards = pgTable(
  'player_cards',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Deliberately not a foreign key: `pnpm cards:import` replaces a set's card rows, and a
    // reference would either block that or delete what players own.
    cardId: text('card_id').notNull(),
    variant: text('variant').notNull(),
    count: integer('count').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.cardId, table.variant] }),
    check('player_cards_count_positive', sql`${table.count} > 0`),
  ],
);
