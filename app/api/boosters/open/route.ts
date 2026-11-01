import { hasLocale } from 'next-intl';
import { getPlayer } from '@/auth/session';
import { isPlayableSet } from '@/game/card-sets';
import { routing } from '@/i18n/routing';
import { openOwnedBooster } from '@/player/progress';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale');
  const setId = searchParams.get('set');

  if (!hasLocale(routing.locales, locale)) {
    return Response.json({ error: 'unknown-locale' }, { status: 400 });
  }
  if (!isPlayableSet(setId)) {
    return Response.json({ error: 'unknown-set' }, { status: 400 });
  }

  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }

    const opened = await openOwnedBooster(player.id, setId, locale);
    if (!opened) {
      return Response.json({ error: 'no-booster' }, { status: 409 });
    }
    return Response.json(opened);
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Opening a booster failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'catalogue-unavailable' }, { status: 503 });
  }
}
