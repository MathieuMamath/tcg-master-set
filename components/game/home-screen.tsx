import { useTranslations } from 'next-intl';
import type { Player } from '@/auth/session';
import type { PlayableSet } from '@/game/card-sets';
import { Game } from './game';

export function HomeScreen({ player, sets }: { player: Player; sets: readonly PlayableSet[] }) {
  const t = useTranslations('Home');

  return (
    <main className="relative flex-1">
      <h1 className="sr-only">{t('title')}</h1>
      <Game player={player} sets={sets} />
    </main>
  );
}
