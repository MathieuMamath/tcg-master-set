import { hasLocale } from 'next-intl';
import { loadBinderCatalogue } from '@/cards/binder-catalogue';
import { ACTIVE_SET_ID } from '@/cards/tcgdex';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get('locale');

  if (!hasLocale(routing.locales, locale)) {
    return Response.json({ error: 'unknown-locale' }, { status: 400 });
  }

  try {
    const catalogue = await loadBinderCatalogue(ACTIVE_SET_ID, locale);
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
