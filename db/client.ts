import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

type Database = NodePgDatabase<typeof schema>;

// Kept on globalThis so hot reloads in development reuse the same connection pool.
const cache = globalThis as typeof globalThis & { database?: Database };

// Connects on first use, so the production build needs no database.
export function getDb(): Database {
  if (!cache.database) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set.');
    }
    cache.database = drizzle(new Pool({ connectionString }), { schema });
  }
  return cache.database;
}
