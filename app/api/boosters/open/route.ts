import { hasLocale } from 'next-intl';
import { getPlayer } from '@/auth/session';
import { loadBoosterPool, loadOpenedCards } from '@/cards/booster-pool';
import { ACTIVE_SET_ID } from '@/cards/tcgdex';
import { drawBooster } from '@/game/booster';
import { routing } from '@/i18n/routing';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale');

  if (!hasLocale(routing.locales, locale)) {
    return Response.json({ error: 'unknown-locale' }, { status: 400 });
  }

  try {
    if (!(await getPlayer())) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }

    const drawn = drawBooster(await loadBoosterPool(ACTIVE_SET_ID));
    if (!drawn) {
      return Response.json({ error: 'catalogue-unavailable' }, { status: 503 });
    }
    return Response.json(await loadOpenedCards(drawn, ACTIVE_SET_ID, locale));
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Opening a booster failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'catalogue-unavailable' }, { status: 503 });
  }
}
