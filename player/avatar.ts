// The look the player walks about as, from the wardrobe in the bedroom.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { playerAvatars } from '@/db/schema';
import { type AvatarSpecies, DEFAULT_SPECIES, isAvatarSpecies } from '@/game/avatar/species';
import { recordEvent } from './events';
import type { Reader } from './wallet';

export async function loadAvatar(database: Reader, userId: string): Promise<AvatarSpecies> {
  const [row] = await database
    .select({ species: playerAvatars.species })
    .from(playerAvatars)
    .where(eq(playerAvatars.userId, userId));
  // An animal the game no longer has falls back to the fox.
  return row && isAvatarSpecies(row.species) ? row.species : DEFAULT_SPECIES;
}

// Puts the player in another animal's look, and records it.
export async function wearAvatar(userId: string, species: AvatarSpecies): Promise<AvatarSpecies> {
  await getDb().transaction(async (transaction) => {
    await transaction
      .insert(playerAvatars)
      .values({ userId, species })
      .onConflictDoUpdate({
        target: playerAvatars.userId,
        set: { species, updatedAt: new Date() },
      });
    await recordEvent(transaction, userId, 'avatar.changed', { species });
  });
  return species;
}
