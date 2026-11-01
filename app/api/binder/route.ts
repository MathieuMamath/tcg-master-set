import { hasLocale } from 'next-intl';
import { getPlayer } from '@/auth/session';
import { loadBinderCatalogue } from '@/cards/binder-catalogue';
import { isPlayableSet } from '@/game/card-sets';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

    const catalogue = await loadBinderCatalogue(setId, locale);
    if (catalogue.cards.length === 0) {
      return Response.json({ error: 'catalogue-unavailable' }, { status: 503 });
    }
    return Response.json(catalogue);
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Loading the binder failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'catalogue-unavailable' }, { status: 503 });
  }
}
