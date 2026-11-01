import { getPlayer } from '@/auth/session';
import { parseSpot } from '@/game/places';
import { savePlayerSpot } from '@/player/progress';

export async function POST(request: Request) {
  const spot = parseSpot(await request.json().catch(() => null));

  if (!spot) {
    return Response.json({ error: 'invalid-spot' }, { status: 400 });
  }

  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    await savePlayerSpot(player.id, spot);
    return new Response(null, { status: 204 });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Saving the spot failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'spot-unavailable' }, { status: 503 });
  }
}
