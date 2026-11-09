'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { CouponSummary } from '@/coupons/admin';
import type { PlayableSet } from '@/game/cards/card-sets';
import { generateCouponCode, MAX_COUPON_BOOSTERS, MAX_COUPON_COINS } from '@/game/cards/coupons';
import { moveThroughChoices } from '../menu-focus';

const FIELD_CLASS =
  'w-full rounded-xs border-2 border-ui-ink/20 bg-ui-paper px-2 py-1 font-game text-lg text-ui-ink outline-none focus-visible:border-ui-stamp';
const BUTTON_CLASS =
  'cursor-pointer ui-paper-button bg-ui-paper px-3 py-1 font-semibold outline-offset-2 hover:bg-ui-accent/40 focus-visible:outline-2 focus-visible:outline-ui-stamp aria-disabled:cursor-wait aria-disabled:opacity-60';

type Props = {
  sets: readonly PlayableSet[];
  onClose: () => void;
};

type Load =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'ready'; coupons: CouponSummary[] };

// Mlle Trotte's register, for admins: the coupons made so far with how many players used each,
// and a form to stamp a new one. The server checks the admin and every field again.
export function CouponRegister({ sets, onClose }: Props) {
  const t = useTranslations('Coupons.register');
  const format = useFormatter();
  const dialog = useRef<HTMLDialogElement>(null);
  const codeField = useRef<HTMLInputElement>(null);
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [code, setCode] = useState('');
  const [coins, setCoins] = useState(0);
  const [boosters, setBoosters] = useState(0);
  const [setId, setSetId] = useState<string>(sets[0]?.id ?? '');
  const [expiresOn, setExpiresOn] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'done'; text: string } | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
    codeField.current?.focus();
    fetch('/api/admin/coupons')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(({ coupons }: { coupons: CouponSummary[] }) => setLoad({ status: 'ready', coupons }))
      .catch(() => setLoad({ status: 'failed' }));
  }, []);

  const setName = (id: string | null) => sets.find((set) => set.id === id)?.name ?? id ?? '';
  const rewardText = (coupon: { coins: number; boosters: number; boosterSetId: string | null }) =>
    [
      coupon.coins > 0 ? t('coins', { count: coupon.coins }) : null,
      coupon.boosters > 0
        ? t('boosters', { count: coupon.boosters, set: setName(coupon.boosterSetId) })
        : null,
    ]
      .filter(Boolean)
      .join(' · ');

  const stamp = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, coins, boosters, boosterSetId: setId, expiresOn }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        setLoad({ status: 'ready', coupons: body.coupons });
        setMessage({ kind: 'done', text: t('stamped', { code: code.trim().toUpperCase() }) });
        setCode('');
        setCoins(0);
        setBoosters(0);
        setExpiresOn('');
        codeField.current?.focus();
      } else {
        const error = ['code', 'coins', 'boosters', 'set', 'reward', 'expiry', 'taken'].includes(
          body.error,
        )
          ? body.error
          : 'unavailable';
        setMessage({ kind: 'error', text: t(`errors.${error}` as 'errors.code') });
      }
    } catch {
      setMessage({ kind: 'error', text: t('errors.unavailable') });
    } finally {
      setIsSaving(false);
    }
  };

  const now = Date.now();
  return (
    <dialog
      ref={dialog}
      aria-labelledby="coupon-register-title"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-1rem))] max-w-none overflow-y-auto ui-scrap p-5 font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="coupon-register-title" className="font-display text-2xl">
          {t('title')}
        </h2>
        <form method="dialog">
          <button type="submit" className={BUTTON_CLASS}>
            {t('close')}
          </button>
        </form>
      </div>
      <form onSubmit={stamp} className="mt-3 grid gap-3 rounded-sm bg-ui-ink/5 p-3 sm:grid-cols-2">
        <label className="grid gap-1 sm:col-span-2">
          <span className="font-semibold">{t('code')}</span>
          <span className="flex gap-2">
            <input
              ref={codeField}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={24}
              autoComplete="off"
              spellCheck={false}
              placeholder="BIENVENUE"
              className={`${FIELD_CLASS} font-digits uppercase`}
            />
            <button
              type="button"
              onClick={() => setCode(generateCouponCode())}
              className={`${BUTTON_CLASS} shrink-0`}
            >
              {t('generate')}
            </button>
          </span>
        </label>
        <label className="grid gap-1">
          <span className="font-semibold">{t('coinsField')}</span>
          <input
            type="number"
            min={0}
            max={MAX_COUPON_COINS}
            step={50}
            value={coins}
            onChange={(event) => setCoins(Math.max(0, Math.floor(Number(event.target.value) || 0)))}
            className={FIELD_CLASS}
          />
        </label>
        <label className="grid gap-1">
          <span className="font-semibold">{t('expiresOn')}</span>
          <input
            type="date"
            value={expiresOn}
            onChange={(event) => setExpiresOn(event.target.value)}
            className={FIELD_CLASS}
          />
        </label>
        <label className="grid gap-1">
          <span className="font-semibold">{t('boostersField')}</span>
          <input
            type="number"
            min={0}
            max={MAX_COUPON_BOOSTERS}
            value={boosters}
            onChange={(event) =>
              setBoosters(Math.max(0, Math.floor(Number(event.target.value) || 0)))
            }
            className={FIELD_CLASS}
          />
        </label>
        <label className="grid gap-1">
          <span className="font-semibold">{t('set')}</span>
          <select
            value={setId}
            onChange={(event) => setSetId(event.target.value)}
            aria-disabled={boosters === 0}
            className={`${FIELD_CLASS} ${boosters === 0 ? 'opacity-50' : ''}`}
          >
            {sets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            aria-disabled={isSaving}
            className={`${BUTTON_CLASS} bg-ui-accent!`}
          >
            {t('stamp')}
          </button>
          <p
            role="status"
            className={message?.kind === 'error' ? 'text-ui-danger' : 'text-ui-gain'}
          >
            {message?.text}
          </p>
        </div>
      </form>
      <h3 className="mt-5 font-display text-lg">{t('list')}</h3>
      {load.status === 'loading' && <p className="text-ui-ink/60">{t('loading')}</p>}
      {load.status === 'failed' && <p>{t('errors.unavailable')}</p>}
      {load.status === 'ready' && load.coupons.length === 0 && (
        <p className="text-ui-ink/60">{t('empty')}</p>
      )}
      {load.status === 'ready' && load.coupons.length > 0 && (
        <ul className="mt-2 grid gap-2">
          {load.coupons.map((coupon) => {
            const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt) : null;
            const isExpired = expiresAt !== null && expiresAt.getTime() <= now;
            return (
              <li
                key={coupon.id}
                className={`grid gap-1 rounded-sm bg-ui-paper px-3 py-2 shadow-[2px_3px_0_var(--ui-shadow)] sm:grid-cols-[minmax(0,1fr)_auto] ${
                  isExpired ? 'opacity-60' : ''
                }`}
              >
                <span>
                  <span className="font-digits text-lg font-bold">{coupon.code}</span>
                  <span className="block text-sm">{rewardText(coupon)}</span>
                  <span className="block text-sm text-ui-ink/60">
                    {expiresAt === null
                      ? t('neverExpires')
                      : isExpired
                        ? t('expired', {
                            date: format.dateTime(expiresAt, { dateStyle: 'medium' }),
                          })
                        : t('expires', {
                            date: format.dateTime(expiresAt, { dateStyle: 'medium' }),
                          })}
                  </span>
                </span>
                <span className="self-center font-digits font-bold sm:text-right">
                  {t('redemptions', { count: coupon.redemptions })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </dialog>
  );
}
