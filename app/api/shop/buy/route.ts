import { getPlayer } from '@/auth/session';
import { isSoldSet } from '@/game/card-sets';
import { parseBoosterQuantity } from '@/game/shop-dialogue';
import { buyBooster } from '@/player/progress';

export async function POST(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const setId = parameters.get('set');
  const quantity = parseBoosterQuantity(parameters.get('quantity'));

  if (!isSoldSet(setId)) {
    return Response.json({ error: 'unknown-set' }, { status: 400 });
  }
  if (quantity === null) {
    return Response.json({ error: 'bad-quantity' }, { status: 400 });
  }

  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    return Response.json(await buyBooster(player.id, setId, quantity));
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Buying a booster failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'shop-unavailable' }, { status: 503 });
  }
}
