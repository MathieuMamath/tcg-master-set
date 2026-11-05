import { bigint, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { GameEventType } from '@/game/events';
import { users } from './auth';

// The game's event log, only ever added to, in the same transaction as what each event records.
// The player is kept for counting players, never shown: statistics only read it in aggregate. A
// deleted account leaves its events, without the link to the player, so that totals stay right.
export const gameEvents = pgTable(
  'game_events',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    type: text('type').$type<GameEventType>().notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => [
    index('game_events_occurred_at_idx').on(table.occurredAt),
    index('game_events_type_occurred_at_idx').on(table.type, table.occurredAt),
    index('game_events_user_id_idx').on(table.userId),
  ],
);
