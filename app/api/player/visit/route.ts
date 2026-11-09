import { hasLocale } from 'next-intl';
import { getPlayer } from '@/auth/session';
import { parseVisit } from '@/game/log/visits';
import { routing } from '@/i18n/routing';
import { recordVisit } from '@/player/visits';

// The game's page was opened. A visit gives no advantage, so a failure is simply let go.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const visit = parseVisit(body, request.headers.get('host') ?? '');
  const locale = (body as { locale?: unknown } | null)?.locale;
  if (!visit || typeof locale !== 'string' || !hasLocale(routing.locales, locale)) {
    return Response.json({ error: 'invalid-visit' }, { status: 400 });
  }
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    await recordVisit(player.id, locale, visit);
    return new Response(null, { status: 204 });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Recording the visit failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'visit-unavailable' }, { status: 503 });
  }
}
