import { hasLocale } from 'next-intl';
import { getPlayer } from '@/auth/session';
import { isBoosterLotSize } from '@/game/cards/booster-lots';
import { isPlayableSet } from '@/game/cards/card-sets';
import { routing } from '@/i18n/routing';
import { openOwnedBoosters } from '@/player/shop';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale');
  const setId = searchParams.get('set');
  // One booster, or a lot of five or ten.
  const size = Number(searchParams.get('count') ?? 1);

  if (!hasLocale(routing.locales, locale)) {
    return Response.json({ error: 'unknown-locale' }, { status: 400 });
  }
  if (!isPlayableSet(setId)) {
    return Response.json({ error: 'unknown-set' }, { status: 400 });
  }
  if (!isBoosterLotSize(size)) {
    return Response.json({ error: 'unknown-count' }, { status: 400 });
  }

  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }

    const opened = await openOwnedBoosters(player.id, setId, locale, size);
    if (opened === 'needsBinder') {
      return Response.json({ error: 'needs-binder' }, { status: 409 });
    }
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
