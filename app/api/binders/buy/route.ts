import { getPlayer } from '@/auth/session';
import { isSoldSet } from '@/game/card-sets';
import { buyBinder } from '@/player/progress';

export async function POST(request: Request) {
  const setId = new URL(request.url).searchParams.get('set');

  if (!isSoldSet(setId)) {
    return Response.json({ error: 'unknown-set' }, { status: 400 });
  }

  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    return Response.json(await buyBinder(player.id, setId));
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Buying a binder failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'shop-unavailable' }, { status: 503 });
  }
}
