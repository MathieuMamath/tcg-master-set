import { getPlayer } from '@/auth/session';
import { isShiftJob } from '@/game/shifts';
import { finishShift } from '@/player/progress';

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
    // Anything unreadable is simply not a list of presses, which the rules refuse.
    const body = await request.json().catch(() => null);
    const result = await finishShift(player.id, job, body?.actions);
    return result
      ? Response.json(result)
      : Response.json({ error: 'cannot-finish' }, { status: 409 });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'The quest failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'quest-unavailable' }, { status: 503 });
  }
}
