'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

// Each language is written in its own language, so these names are not translated.
const LOCALE_NAMES = { en: 'English', fr: 'Français' } as const;

// The account pages' language choice: a little paper pill in the corner, the current language on
// yellow. Switching keeps the page the player is on.
export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const currentLocale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t('label')} className="flex justify-end p-4 font-game">
      <div className="flex gap-1 rounded-full border-2 border-ui-ink/15 bg-ui-paper p-1 shadow-[3px_4px_0_var(--ui-shadow)]">
        {routing.locales.map((locale) => (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            lang={locale}
            aria-current={locale === currentLocale ? 'true' : undefined}
            className="rounded-full border-2 border-transparent px-3 py-0.5 text-sm font-semibold text-ui-ink/70 outline-offset-2 hover:bg-ui-accent/30 hover:text-ui-ink focus-visible:outline-2 aria-[current]:border-ui-ink aria-[current]:bg-ui-accent aria-[current]:text-ui-ink"
          >
            {LOCALE_NAMES[locale]}
          </Link>
        ))}
      </div>
    </nav>
  );
}
