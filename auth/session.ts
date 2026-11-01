import { headers } from 'next/headers';
import { getAuth } from './server';

export type Player = {
  id: string;
  username: string;
};

export async function getPlayer(): Promise<Player | null> {
  // First, because this is what tells the build that the page is dynamic, before it needs secrets.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) {
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.displayUsername ?? session.user.name,
  };
}
