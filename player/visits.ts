// Visits to the game's page and the browser's reports of how players play, for the event log.

import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { gameEvents } from '@/db/schema';
import type { Report } from '@/game/log/reports';
import { type Visit, visitSeconds } from '@/game/log/visits';
import { recordEvent } from './events';

// Each opening of the game's page, for the statistics: the visits, where they came from and on what.
export async function recordVisit(userId: string, locale: string, visit: Visit): Promise<void> {
  await recordEvent(getDb(), userId, 'game.opened', { locale, ...visit });
}

// Leaving the page closes the last visit, timed by the server from its opening, unless it was
// already closed or lasted longer than any real visit.
export async function recordVisitEnd(userId: string, now = new Date()): Promise<void> {
  await getDb().transaction(async (transaction) => {
    const [last] = await transaction
      .select({ type: gameEvents.type, occurredAt: gameEvents.occurredAt })
      .from(gameEvents)
      .where(
        and(eq(gameEvents.userId, userId), sql`${gameEvents.type} in ('game.opened', 'game.left')`),
      )
      .orderBy(desc(gameEvents.occurredAt))
      .limit(1);
    if (last?.type !== 'game.opened') {
      return;
    }
    const seconds = visitSeconds(last.occurredAt, now);
    if (seconds !== null) {
      await recordEvent(transaction, userId, 'game.left', { seconds });
    }
  });
}

// What the browser reports of how players play, for the statistics only.
export async function recordReport(userId: string, report: Report): Promise<void> {
  const database = getDb();
  switch (report.type) {
    case 'npc.talked':
      return recordEvent(database, userId, 'npc.talked', report.details);
    case 'shop.viewed':
      return recordEvent(database, userId, 'shop.viewed', report.details);
    case 'binder.viewed':
      return recordEvent(database, userId, 'binder.viewed', report.details);
    case 'booster.abandoned':
      return recordEvent(database, userId, 'booster.abandoned', report.details);
  }
}
