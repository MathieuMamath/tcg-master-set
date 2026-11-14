import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { MemoryGame } from '@/game/quests/memory-game';
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

// Where the character stands, so that a player comes back to the same spot.
export const playerSpots = pgTable('player_spots', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  place: text('place').notNull(),
  // How far along the place's floor, now that the world is seen from the side.
  x: doublePrecision('x').notNull(),
  // 1 facing right, -1 facing left.
  facing: smallint('facing').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// How far the player's sleeps moved the game's clock on, in game minutes, within a day. The clock
// itself is shared and only for show.
export const playerClocks = pgTable(
  'player_clocks',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    offset: integer('offset').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('player_clocks_offset_within_a_day', sql`${table.offset} between 0 and 1439`)],
);

// The player's own preferences, kept so that they hold on every device and visit. A missing row
// means the defaults.
export const playerSettings = pgTable('player_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Whether a cut pack climbs through light effects up to its best card before showing it.
  pullEffects: boolean('pull_effects').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// The look the player walks about as, chosen at the wardrobe in the bedroom. A missing row means
// the fox everyone starts as.
export const playerAvatars = pgTable('player_avatars', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  species: text('species').notNull().default('fox'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

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

// The binders the player has bought. Buying a set's boosters requires its binder.
export const playerBinders = pgTable(
  'player_binders',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    setId: text('set_id')
      .notNull()
      .references(() => cardSets.id),
  },
  (table) => [primaryKey({ columns: [table.userId, table.setId] })],
);

// Where each player stands with each quest: the attempt under way, and the day of the last reward.
export const playerQuests = pgTable(
  'player_quests',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questId: text('quest_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedOn: text('completed_on'),
    // The coins paid on `completedOn`, for the quests that pay more as a better score comes.
    paidCoins: integer('paid_coins').notNull().default(0),
    // The memory game under way, for the quest whose board the browser must not know.
    memoryGame: jsonb('memory_game').$type<MemoryGame>(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.questId] })],
);

// Each player's best score on each arcade game.
export const playerHighScores = pgTable(
  'player_high_scores',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    game: text('game').notNull(),
    score: integer('score').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.game] })],
);
