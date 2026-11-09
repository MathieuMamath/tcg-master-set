import { isAdmin } from '@/auth/roles';
import { getPlayer } from '@/auth/session';
import { isStatsPeriod } from '@/game/log/stats';
import { loadGameStats } from '@/stats/game-stats';

// Mme Hulotte's reports, for admins only, checked here on every request: Brutus at the door is only
// a picture of this rule. Only aggregates ever go out.
export async function GET(request: Request) {
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    if (!(await isAdmin(player.id))) {
      return Response.json({ error: 'not-an-admin' }, { status: 403 });
    }
    const period = new URL(request.url).searchParams.get('period');
    if (!isStatsPeriod(period)) {
      return Response.json({ error: 'unknown-period' }, { status: 400 });
    }
    return Response.json(await loadGameStats(period));
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'The statistics failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'stats-unavailable' }, { status: 503 });
  }
}
