import { getPlayer } from '@/auth/session';
import { parseItemRequest } from '@/game/avatar/items';
import { buyItem } from '@/player/avatar';

// Buys an item at the boutique downtown, from its fitting room, and puts it on.
export async function POST(request: Request) {
  const item = parseItemRequest(await request.json().catch(() => null));

  if (!item) {
    return Response.json({ error: 'unknown-item' }, { status: 400 });
  }

  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    return Response.json(await buyItem(player.id, item));
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Buying an item failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'boutique-unavailable' }, { status: 503 });
  }
}
