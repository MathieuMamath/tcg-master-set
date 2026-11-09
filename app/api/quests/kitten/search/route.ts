import { getPlayer } from '@/auth/session';
import { searchForKitten } from '@/player/quests/kitten';

export async function POST(request: Request) {
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    // Anything unreadable is simply no hiding place, which the rules refuse.
    const body = await request.json().catch(() => null);
    const result = await searchForKitten(player.id, body?.spot);
    return result ? Response.json(result) : Response.json({ error: 'no-hunt' }, { status: 409 });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'The quest failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'quest-unavailable' }, { status: 503 });
  }
}
