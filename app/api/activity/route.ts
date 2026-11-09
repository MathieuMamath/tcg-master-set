import { getPlayer } from '@/auth/session';
import { loadPlayerActivity } from '@/player/activity';

// Today's quests done, read again whenever the game closes a dialog.
export async function GET() {
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    return Response.json(await loadPlayerActivity(player.id));
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'The activity failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'activity-unavailable' }, { status: 503 });
  }
}
