import type { getDb } from '@/db/client';
import { gameEvents } from '@/db/schema';
import type { GameEventDetails, GameEventType } from '@/game/log/events';

type Writer = Pick<ReturnType<typeof getDb>, 'insert'>;

// Records one event of the catalogue. Called with the transaction of what it records, so that an
// event exists exactly when its action does.
export async function recordEvent<Type extends GameEventType>(
  database: Writer,
  userId: string,
  type: Type,
  details: GameEventDetails[Type],
): Promise<void> {
  await database.insert(gameEvents).values({ userId, type, details });
}
