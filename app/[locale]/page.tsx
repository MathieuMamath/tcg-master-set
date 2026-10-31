import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <p>{t('tagline')}</p>
    </main>
  );
}
