import { hasLocale } from 'next-intl';
import { isAdmin } from '@/auth/roles';
import { getPlayer } from '@/auth/session';
import { isPlayableSet } from '@/game/card-sets';
import { routing } from '@/i18n/routing';
import { loadSetDropOverview, loadSetDrops } from '@/stats/card-stats';

export const dynamic = 'force-dynamic';

// The boosters' draws card by card, for Mme Hulotte's reports: an overview of every set, or one
// set's cards with their rates. Admins only, checked on every request, and only aggregates go out.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get('set');
  const locale = searchParams.get('locale');
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    if (!(await isAdmin(player.id))) {
      return Response.json({ error: 'not-an-admin' }, { status: 403 });
    }
    if (setId === null) {
      return Response.json({ sets: await loadSetDropOverview() });
    }
    if (!isPlayableSet(setId)) {
      return Response.json({ error: 'unknown-set' }, { status: 400 });
    }
    if (!hasLocale(routing.locales, locale)) {
      return Response.json({ error: 'unknown-locale' }, { status: 400 });
    }
    return Response.json(await loadSetDrops(setId, locale));
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'The card statistics failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'stats-unavailable' }, { status: 503 });
  }
}
