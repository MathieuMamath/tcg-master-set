import { useTranslations } from 'next-intl';
import type { Player } from '@/auth/session';
import { Game } from './game';

export function HomeScreen({ player }: { player: Player }) {
  const t = useTranslations('Home');

  return (
    <main className="relative flex-1">
      <h1 className="sr-only">{t('title')}</h1>
      <Game player={player} />
    </main>
  );
}
