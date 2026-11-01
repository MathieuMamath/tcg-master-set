import type { Locale } from 'next-intl';
import { getPlayer } from '@/auth/session';
import { loadPlayableSets } from '@/cards/playable-sets';
import { HomeScreen } from '@/components/game/home-screen';
import { redirect } from '@/i18n/navigation';
import { loadPlayerProgress } from '@/player/progress';

type Props = {
  // The root layout has already rejected any unknown language.
  params: Promise<{ locale: Locale }>;
};

// Playing requires an account.
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const player = await getPlayer();

  if (!player) {
    return redirect({ href: '/signup', locale });
  }

  const [sets, progress] = await Promise.all([
    loadPlayableSets(locale),
    loadPlayerProgress(player.id),
  ]);

  return <HomeScreen player={player} sets={sets} progress={progress} />;
}
