import type { NextRequest } from 'next/server';
import { hasLocale } from 'next-intl';
import { getPlayer } from '@/auth/session';
import { pickMemoryCards } from '@/cards/memory-cards';
import { MEMORY_PAIRS } from '@/game/memory-game';
import { routing } from '@/i18n/routing';
import { startGrandpaQuest } from '@/player/progress';

export async function POST(request: NextRequest) {
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    const locale = request.nextUrl.searchParams.get('locale');
    if (!hasLocale(routing.locales, locale)) {
      return Response.json({ error: 'unknown-locale' }, { status: 400 });
    }
    const cards = await pickMemoryCards(locale);
    if (cards.length < MEMORY_PAIRS) {
      return Response.json({ error: 'not-enough-cards' }, { status: 503 });
    }
    const { hasStarted } = await startGrandpaQuest(player.id);
    return Response.json({ hasStarted, cards: hasStarted ? cards : [] });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'The quest failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'quest-unavailable' }, { status: 503 });
  }
}
