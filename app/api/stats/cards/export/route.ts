import { hasLocale } from 'next-intl';
import { isAdmin } from '@/auth/roles';
import { getPlayer } from '@/auth/session';
import { cardStatsCsv } from '@/game/cards/card-stats';
import { routing } from '@/i18n/routing';
import { loadCardStatsRows } from '@/stats/card-stats';

export const dynamic = 'force-dynamic';

// The full card statistics as a CSV file, every version of every set, for Bastien to hand over in
// the administrative office. Admins only, checked on every request, and only aggregates go out.
export async function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get('locale');
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    if (!(await isAdmin(player.id))) {
      return Response.json({ error: 'not-an-admin' }, { status: 403 });
    }
    if (!hasLocale(routing.locales, locale)) {
      return Response.json({ error: 'unknown-locale' }, { status: 400 });
    }
    const csv = cardStatsCsv(await loadCardStatsRows(locale));
    const day = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="card-stats-${day}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'The card statistics export failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'stats-unavailable' }, { status: 503 });
  }
}
