import { getPlayer } from '@/auth/session';
import { sleepUntilMorning } from '@/player/progress';

// Going to bed: the server moves the player's clock on to the morning, if it is night for them.
export async function POST() {
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    const clockOffset = await sleepUntilMorning(player.id);
    if (clockOffset === null) {
      return Response.json({ error: 'not-sleepy' }, { status: 409 });
    }
    return Response.json({ clockOffset });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Sleeping failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'sleep-unavailable' }, { status: 503 });
  }
}
