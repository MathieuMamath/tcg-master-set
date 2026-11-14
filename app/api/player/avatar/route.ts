import { getPlayer } from '@/auth/session';
import { parseAvatarChange } from '@/game/avatar/species';
import { wearAvatar } from '@/player/avatar';

// Puts the player in another animal's look, from the wardrobe in the bedroom.
export async function PUT(request: Request) {
  const species = parseAvatarChange(await request.json().catch(() => null));

  if (!species) {
    return Response.json({ error: 'invalid-avatar' }, { status: 400 });
  }

  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    return Response.json({ species: await wearAvatar(player.id, species) });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Changing the avatar failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'avatar-unavailable' }, { status: 503 });
  }
}
