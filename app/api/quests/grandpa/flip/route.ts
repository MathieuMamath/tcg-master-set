import type { NextRequest } from 'next/server';
import { getPlayer } from '@/auth/session';
import { flipGrandpaCard } from '@/player/quests/memory';

export async function POST(request: NextRequest) {
  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    const position = Number(request.nextUrl.searchParams.get('position') ?? Number.NaN);
    const answer = await flipGrandpaCard(player.id, position);
    return answer
      ? Response.json(answer)
      : Response.json({ error: 'cannot-flip' }, { status: 409 });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'The quest failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'quest-unavailable' }, { status: 503 });
  }
}
