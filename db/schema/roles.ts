import { sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './auth';

// The players with a role beyond playing, set by hand in the database: an admin may enter the
// statistics bureau. Kept apart from the accounts' own tables, which Better Auth manages.
export const playerRoles = pgTable(
  'player_roles',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('player_roles_role_check', sql`${table.role} in ('admin')`)],
);
