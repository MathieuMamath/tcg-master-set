import { getPlayer } from '@/auth/session';
import { parseSettingsChange } from '@/game/ui/settings';
import { saveSettings } from '@/player/settings';

// Changes the player's own preferences, from the settings menu.
export async function PUT(request: Request) {
  const change = parseSettingsChange(await request.json().catch(() => null));

  if (!change) {
    return Response.json({ error: 'invalid-settings' }, { status: 400 });
  }

  try {
    const player = await getPlayer();
    if (!player) {
      return Response.json({ error: 'not-signed-in' }, { status: 401 });
    }
    return Response.json({ settings: await saveSettings(player.id, change) });
  } catch (error) {
    // Logged as text: the full error object carries the database client's internals.
    console.error(
      'Saving the settings failed:',
      String(error instanceof Error ? (error.cause ?? error) : error),
    );
    return Response.json({ error: 'settings-unavailable' }, { status: 503 });
  }
}
