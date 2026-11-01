'use client';

import { type Locale, useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { authClient } from '@/auth/client';
import { useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { moveThroughChoices } from './menu-focus';

// Each language is written in its own language, so these names are not translated.
const LANGUAGE_NAMES: Record<Locale, string> = { en: 'English', fr: 'Français' };

type Props = {
  onClose: () => void;
};

export function SettingsMenu({ onClose }: Props) {
  const t = useTranslations('Settings');
  const currentLanguage = useLocale();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const signOut = async () => {
    await authClient.signOut();
    // A full load, so that the server sees the session has ended.
    window.location.assign(`/${currentLanguage}/login`);
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="settings-title"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl border-4 border-ui-ink bg-ui-paper p-5 font-game text-ui-ink shadow-[0_6px_0_var(--ui-ink)] backdrop:bg-ui-ink/50"
    >
      <h2 id="settings-title" className="text-center text-xl font-semibold">
        {t('title')}
      </h2>
      <fieldset className="mt-4">
        <legend className="font-semibold">{t('language')}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {routing.locales.map((language) => (
            <label
              key={language}
              lang={language}
              className="cursor-pointer rounded-full border-3 border-ui-ink py-1 text-center font-semibold outline-offset-2 hover:bg-ui-accent/40 has-checked:bg-ui-accent has-focus-visible:outline-2"
            >
              <input
                type="radio"
                name="language"
                className="sr-only"
                checked={language === currentLanguage}
                onChange={() => router.replace('/', { locale: language })}
              />
              {LANGUAGE_NAMES[language]}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        onClick={signOut}
        className="mt-5 w-full cursor-pointer rounded-full border-3 border-ui-ink py-1 font-semibold hover:bg-ui-ink/10"
      >
        {t('signOut')}
      </button>
      <form method="dialog" className="mt-4 text-center">
        <button type="submit" className="cursor-pointer font-semibold underline">
          {t('close')}
        </button>
      </form>
    </dialog>
  );
}
