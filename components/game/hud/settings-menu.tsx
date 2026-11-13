'use client';

import { type Locale, useLocale, useTranslations } from 'next-intl';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { authClient } from '@/auth/client';
import type { PlayableSet } from '@/game/cards/card-sets';
import type { Wallet } from '@/game/cards/shop-dialogue';
import { useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { moveThroughChoices, openDialog } from '../menu-focus';

// Each language is written in its own language, so these names are not translated.
const LANGUAGE_NAMES: Record<Locale, string> = { en: 'English', fr: 'Français' };

type Props = {
  sets: readonly PlayableSet[];
  // A coupon used here gives coins or boosters, shown at once in the game's counters.
  onRedeemed: (wallet: Wallet) => void;
  // Opens the "What's new?" sheet with every note.
  onShowNews: () => void;
  onClose: () => void;
};

export function SettingsMenu({ sets, onRedeemed, onShowNews, onClose }: Props) {
  const t = useTranslations('Settings');
  const tCoupon = useTranslations('Coupons.redeem');
  const tNews = useTranslations('News');
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [result, setResult] = useState<{ kind: 'done' | 'error'; text: string } | null>(null);

  // The server alone checks the code and pays: this only shows what it answered.
  const redeem = async (event: FormEvent) => {
    event.preventDefault();
    if (isRedeeming || code.trim() === '') {
      return;
    }
    setIsRedeeming(true);
    setResult(null);
    try {
      const response = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const answer = await response.json();
      if (answer.status === 'redeemed') {
        onRedeemed(answer.wallet);
        const setName = sets.find(({ id }) => id === answer.boosterSetId)?.name ?? '';
        const gifts = [
          answer.coins > 0 ? tCoupon('coins', { count: answer.coins }) : null,
          answer.boosters > 0
            ? tCoupon('boosters', { count: answer.boosters, set: setName })
            : null,
        ].filter(Boolean);
        setResult({ kind: 'done', text: tCoupon('redeemed', { gifts: gifts.join(' + ') }) });
        setCode('');
      } else {
        const status = ['unknown', 'expired', 'alreadyUsed'].includes(answer.status)
          ? answer.status
          : 'unknown';
        setResult({ kind: 'error', text: tCoupon(status as 'unknown') });
      }
    } catch {
      setResult({ kind: 'error', text: tCoupon('unavailable') });
    } finally {
      setIsRedeeming(false);
    }
  };
  const currentLanguage = useLocale();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    openDialog(dialog.current);
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
      className="ui-pop-in m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto bg-transparent px-0 pt-6 pr-2 pb-3 font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <div className="ui-sheet px-5 pb-5">
        <span aria-hidden="true" className="ui-paper-grain absolute inset-0 rounded-[0.8rem]" />
        <div className="relative">
          <div className="text-center">
            <h2
              id="settings-title"
              className="-mb-2 ui-sheet-tag -translate-y-1/2 font-display text-xl leading-tight"
            >
              {t('title')}
            </h2>
          </div>
          <fieldset>
            <legend className="font-semibold">{t('language')}</legend>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-full border-2 border-ui-ink/15 bg-ui-ink/5 p-1">
              {routing.locales.map((language) => (
                <label
                  key={language}
                  lang={language}
                  className="cursor-pointer rounded-full border-2 border-transparent py-1 text-center font-semibold text-ui-ink/70 outline-offset-2 hover:bg-ui-accent/30 hover:text-ui-ink has-checked:border-ui-ink has-checked:bg-ui-accent has-checked:text-ui-ink has-focus-visible:outline-2"
                >
                  <input
                    type="radio"
                    name="language"
                    className="sr-only"
                    checked={language === currentLanguage}
                    // The current language is where the menu opens, as before.
                    data-first-focus={language === currentLanguage || undefined}
                    onChange={() => router.replace('/', { locale: language })}
                  />
                  {LANGUAGE_NAMES[language]}
                </label>
              ))}
            </div>
          </fieldset>
          <form
            onSubmit={redeem}
            className="mt-4 border-t-2 border-dashed border-ui-accent-dark/40 pt-3"
          >
            <label htmlFor="coupon-code" className="font-semibold">
              {tCoupon('label')}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="coupon-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                maxLength={24}
                autoComplete="off"
                spellCheck={false}
                placeholder={tCoupon('placeholder')}
                className="w-full min-w-0 ui-field px-3 py-1.5 font-digits uppercase"
              />
              <button
                type="submit"
                aria-disabled={isRedeeming}
                className="shrink-0 cursor-pointer ui-chunky-button bg-ui-accent px-4 py-1.5 font-semibold outline-offset-4 focus-visible:outline-2 aria-disabled:cursor-wait"
              >
                {tCoupon('use')}
              </button>
            </div>
            <p
              role="status"
              className={`mt-1 min-h-6 text-sm ${result?.kind === 'error' ? 'text-ui-danger' : 'text-ui-gain'}`}
            >
              {result?.text}
            </p>
          </form>
          <div className="flex flex-col gap-3 border-t-2 border-dashed border-ui-accent-dark/40 pt-4">
            <button
              type="button"
              onClick={onShowNews}
              className="w-full cursor-pointer ui-chunky-button bg-ui-paper py-2 font-semibold outline-offset-4 hover:bg-ui-accent/30 focus-visible:outline-2"
            >
              {tNews('open')}
            </button>
            <button
              type="button"
              onClick={signOut}
              className="w-full cursor-pointer ui-chunky-button bg-ui-paper py-2 font-semibold outline-offset-4 hover:bg-ui-accent/30 focus-visible:outline-2"
            >
              {t('signOut')}
            </button>
          </div>
          <form method="dialog" className="mt-4 text-center">
            <button
              type="submit"
              className="cursor-pointer rounded-full px-4 py-1 font-semibold underline underline-offset-4 outline-offset-2 hover:bg-ui-ink/10 focus-visible:outline-2"
            >
              {t('close')}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}
