import { hasLocale } from 'next-intl';
import { getPlayer } from '@/auth/session';
import { loadBoosterPool, loadOpenedCards } from '@/cards/booster-pool';
import { BOOSTER_RECIPES, openBooster } from '@/game/booster';
import { isPlayableSet } from '@/game/card-sets';
import { routing } from '@/i18n/routing';

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
    if (!(await getPlayer())) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }

    const opened = openBooster(await loadBoosterPool(setId), BOOSTER_RECIPES[setId]);
    if (!opened) {
      return Response.json({ error: 'catalogue-unavailable' }, { status: 503 });
    }
    return Response.json({
      ...(await loadOpenedCards(opened.cards, setId, locale)),
      isGodPack: opened.isGodPack,
    });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Opening a booster failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'catalogue-unavailable' }, { status: 503 });
  }
}
