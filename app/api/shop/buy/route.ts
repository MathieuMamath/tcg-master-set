import { getPlayer } from '@/auth/session';
import { isPlayableSet } from '@/game/card-sets';
import { buyBooster } from '@/player/progress';

export async function POST(request: Request) {
  const setId = new URL(request.url).searchParams.get('set');

  if (!isPlayableSet(setId)) {
    return Response.json({ error: 'unknown-set' }, { status: 400 });
  }

  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    return Response.json(await buyBooster(player.id, setId));
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Buying a booster failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'shop-unavailable' }, { status: 503 });
  }
}
