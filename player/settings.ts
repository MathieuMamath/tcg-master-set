// The player's own preferences, from the settings menu.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { playerSettings } from '@/db/schema';
import { DEFAULT_SETTINGS, type PlayerSettings } from '@/game/ui/settings';
import type { Reader } from './wallet';

export async function loadSettings(database: Reader, userId: string): Promise<PlayerSettings> {
  const [row] = await database
    .select({ pullEffects: playerSettings.pullEffects })
    .from(playerSettings)
    .where(eq(playerSettings.userId, userId));
  return row ?? DEFAULT_SETTINGS;
}

// Saves the settings the change names, and returns them all as they now stand.
export async function saveSettings(
  userId: string,
  change: Partial<PlayerSettings>,
): Promise<PlayerSettings> {
  const settings = { ...(await loadSettings(getDb(), userId)), ...change };
  await getDb()
    .insert(playerSettings)
    .values({ userId, ...settings })
    .onConflictDoUpdate({
      target: playerSettings.userId,
      set: { ...settings, updatedAt: new Date() },
    });
  return settings;
}
