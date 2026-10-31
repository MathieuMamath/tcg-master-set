import { useTranslations } from 'next-intl';
import { Game } from '@/components/game/game';

export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <main className="relative flex-1">
      <h1 className="sr-only">{t('title')}</h1>
      <Game />
    </main>
  );
}
