import { getPlayer } from '@/auth/session';
import { parseWearRequest } from '@/game/avatar/items';
import { wearItem } from '@/player/avatar';

// Puts on an item the player has in its slot, at the fitting room or the wardrobe.
export async function PUT(request: Request) {
  const change = parseWearRequest(await request.json().catch(() => null));

  if (!change) {
    return Response.json({ error: 'invalid-item' }, { status: 400 });
  }

  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    if (!(await wearItem(player.id, change.slot, change.item))) {
      return Response.json({ error: 'item-not-owned' }, { status: 403 });
    }
    return Response.json(change);
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Putting on an item failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'look-unavailable' }, { status: 503 });
  }
}
