import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

// Each language is written in its own language, so these names are not translated.
const LOCALE_NAMES = { en: 'English', fr: 'Français' } as const;

export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const currentLocale = useLocale();

  return (
    <nav aria-label={t('label')} className="flex justify-end gap-3 p-4 text-sm">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href="/"
          locale={locale}
          lang={locale}
          aria-current={locale === currentLocale ? 'true' : undefined}
          className="underline-offset-4 hover:underline aria-[current]:font-semibold"
        >
          {LOCALE_NAMES[locale]}
        </Link>
      ))}
    </nav>
  );
}
