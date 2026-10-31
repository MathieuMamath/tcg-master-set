import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: 'ok', db: 'up' });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Health check failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ status: 'error', db: 'down' }, { status: 503 });
  }
}
