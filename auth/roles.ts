import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { playerRoles } from '@/db/schema';

// Whether the player may enter the administrative office. Read on the server only: the browser is told
// the answer, but every statistics request checks it again here.
export async function isAdmin(userId: string): Promise<boolean> {
  const [role] = await getDb()
    .select({ role: playerRoles.role })
    .from(playerRoles)
    .where(eq(playerRoles.userId, userId));
  return role?.role === 'admin';
}
