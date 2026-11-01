import { headers } from 'next/headers';
import { getAuth } from './server';

export type Player = {
  id: string;
  username: string;
};

export async function getPlayer(): Promise<Player | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.displayUsername ?? session.user.name,
  };
}
