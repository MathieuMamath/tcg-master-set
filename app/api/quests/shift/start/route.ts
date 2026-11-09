import { getPlayer } from '@/auth/session';
import { isShiftJob } from '@/game/quests/shifts/shifts';
import { startShift } from '@/player/quests/shifts';

export async function POST(request: Request) {
  const job = new URL(request.url).searchParams.get('job');
  if (!isShiftJob(job)) {
    return Response.json({ error: 'unknown-job' }, { status: 400 });
  }

  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    return Response.json(await startShift(player.id, job));
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'The quest failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'quest-unavailable' }, { status: 503 });
  }
}
