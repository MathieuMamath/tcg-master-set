import { getPlayer } from '@/auth/session';
import { recordVisitEnd } from '@/player/progress';

// The game's page was left, by a beacon that outlives it. The server times the visit itself.
export async function POST() {
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    await recordVisitEnd(player.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Recording the end of the visit failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'visit-unavailable' }, { status: 503 });
  }
}
