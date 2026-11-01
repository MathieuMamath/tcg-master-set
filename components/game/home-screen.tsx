import { useTranslations } from 'next-intl';
import type { Player } from '@/auth/session';
import type { PlayableSet } from '@/game/card-sets';
import type { PlayerProgress } from '@/player/progress';
import { Game } from './game';

type Props = {
  player: Player;
  sets: readonly PlayableSet[];
  progress: PlayerProgress;
};

export function HomeScreen({ player, sets, progress }: Props) {
  const t = useTranslations('Home');

  return (
    <main className="relative flex-1">
      <h1 className="sr-only">{t('title')}</h1>
      <Game player={player} sets={sets} progress={progress} />
    </main>
  );
}
