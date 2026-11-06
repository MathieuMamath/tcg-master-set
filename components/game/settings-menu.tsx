'use client';

import { type Locale, useLocale, useTranslations } from 'next-intl';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { authClient } from '@/auth/client';
import type { PlayableSet } from '@/game/card-sets';
import type { Wallet } from '@/game/shop-dialogue';
import { useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { moveThroughChoices } from './menu-focus';

// Each language is written in its own language, so these names are not translated.
const LANGUAGE_NAMES: Record<Locale, string> = { en: 'English', fr: 'Français' };

type Props = {
  sets: readonly PlayableSet[];
  // A coupon used here gives coins or boosters, shown at once in the game's counters.
  onRedeemed: (wallet: Wallet) => void;
  onClose: () => void;
};

export function SettingsMenu({ sets, onRedeemed, onClose }: Props) {
  const t = useTranslations('Settings');
  const tCoupon = useTranslations('Coupons.redeem');
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
      className="ui-pop-in m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto ui-scrap p-5 font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <h2 id="settings-title" className="text-center font-display text-xl">
        {t('title')}
      </h2>
      <fieldset className="mt-4">
        <legend className="font-semibold">{t('language')}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {routing.locales.map((language) => (
            <label
              key={language}
              lang={language}
              className="cursor-pointer ui-paper-button bg-ui-paper py-1 text-center font-semibold outline-offset-2 hover:bg-ui-accent/40 has-checked:bg-ui-accent has-focus-visible:outline-2"
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
      <form onSubmit={redeem} className="mt-5">
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
            className="w-full min-w-0 rounded-xs border-2 border-ui-ink/20 bg-ui-paper px-2 py-1 font-digits uppercase outline-none focus-visible:border-ui-stamp"
          />
          <button
            type="submit"
            aria-disabled={isRedeeming}
            className="shrink-0 cursor-pointer ui-paper-button bg-ui-accent px-3 py-1 font-semibold outline-offset-2 focus-visible:outline-2 aria-disabled:cursor-wait"
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
      <button
        type="button"
        onClick={signOut}
        className="mt-2 w-full cursor-pointer ui-paper-button bg-ui-paper py-1 font-semibold hover:bg-ui-ink/10"
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
