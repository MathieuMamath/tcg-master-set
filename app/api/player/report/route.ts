import { getPlayer } from '@/auth/session';
import { parseReport } from '@/game/log/reports';
import { recordReport } from '@/player/visits';

// How players play, reported by the browser for the statistics. Nothing here gives an advantage,
// so a failure is simply let go.
export async function POST(request: Request) {
  const report = parseReport(await request.json().catch(() => null));
  if (!report) {
    return Response.json({ error: 'invalid-report' }, { status: 400 });
  }
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    await recordReport(player.id, report);
    return new Response(null, { status: 204 });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Recording the report failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'report-unavailable' }, { status: 503 });
  }
}
