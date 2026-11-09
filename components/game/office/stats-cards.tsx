'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { PlayableSet, SetId } from '@/game/cards/card-sets';
import type { SetDropOverview, SetDrops } from '@/stats/card-stats';
import { CardPicture } from '../boosters/card-picture';
import { SetLogo } from '../boosters/set-logo';

const BUTTON_CLASS =
  'cursor-pointer rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fc0ff]';

type Load<Data> = { status: 'loading' } | { status: 'failed' } | { status: 'ready'; data: Data };

function useStatsFetch<Data>(url: string): Load<Data> {
  const [load, setLoad] = useState<Load<Data>>({ status: 'loading' });
  useEffect(() => {
    let isCurrent = true;
    setLoad({ status: 'loading' });
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data: Data) => isCurrent && setLoad({ status: 'ready', data }))
      .catch(() => isCurrent && setLoad({ status: 'failed' }));
    return () => {
      isCurrent = false;
    };
  }, [url]);
  return load;
}

// Mme Hulotte's card report: every binder, then a binder's cards with how often each came out of
// its boosters since the start, to check the draws against the recipes.
export function CardDropPanel({ sets }: { sets: readonly PlayableSet[] }) {
  const t = useTranslations('Stats.cards');
  const format = useFormatter();
  const [chosen, setChosen] = useState<SetId | null>(null);
  const overview = useStatsFetch<{ sets: SetDropOverview[] }>('/api/stats/cards');
  const lastChosen = useRef<SetId | null>(null);
  const setButtons = useRef(new Map<SetId, HTMLButtonElement>());

  // Back on the list, the focus returns to the binder just looked at.
  useEffect(() => {
    if (chosen === null && lastChosen.current) {
      setButtons.current.get(lastChosen.current)?.focus();
    }
  }, [chosen]);

  if (chosen) {
    const set = sets.find(({ id }) => id === chosen);
    return (
      <SetDropView
        setId={chosen}
        fallbackName={set?.name ?? chosen}
        onBack={() => {
          lastChosen.current = chosen;
          setChosen(null);
        }}
      />
    );
  }

  return (
    <section className="mt-4">
      <h3 className="font-semibold">{t('title')}</h3>
      <p className="mb-3 text-sm text-[#9aa7ba]">{t('hint')}</p>
      {overview.status === 'failed' && <p>{t('error')}</p>}
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sets.map((set) => {
          const seen =
            overview.status === 'ready'
              ? overview.data.sets.find(({ setId }) => setId === set.id)
              : undefined;
          return (
            <li key={set.id}>
              <button
                type="button"
                ref={(button) => {
                  if (button) {
                    setButtons.current.set(set.id, button);
                  }
                }}
                onClick={() => setChosen(set.id)}
                className={`${BUTTON_CLASS} flex w-full flex-col items-center gap-2 bg-[#141c2b] px-3 pt-3 pb-2.5 text-center ring-1 ring-[#26324a] hover:bg-[#1c2638]`}
              >
                <span className="flex h-16 w-full items-center justify-center">
                  <SetLogo setName={set.name} logoUrl={set.logoUrl} />
                </span>
                <span className="font-semibold">{set.name}</span>
                <span className="font-digits text-xs text-[#9aa7ba]">
                  {overview.status === 'ready'
                    ? t('setSummary', {
                        boosters: seen?.boosters ?? 0,
                        pulled: format.number(seen?.versionsPulled ?? 0),
                        total: format.number(set.slotTotal),
                      })
                    : t('loading')}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SetDropView({
  setId,
  fallbackName,
  onBack,
}: {
  setId: SetId;
  fallbackName: string;
  onBack: () => void;
}) {
  const t = useTranslations('Stats.cards');
  const tVariants = useTranslations('Binder.variants');
  const format = useFormatter();
  const locale = useLocale();
  const load = useStatsFetch<SetDrops>(`/api/stats/cards?set=${setId}&locale=${locale}`);
  const back = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    back.current?.focus();
  }, []);

  const variantName = (variant: string) =>
    variant === 'normal' || !['holo', 'reverse', 'firstEdition', 'wPromo'].includes(variant)
      ? null
      : tVariants(variant as 'holo');

  return (
    <section className="mt-4">
      <button
        ref={back}
        type="button"
        onClick={onBack}
        className={`${BUTTON_CLASS} bg-[#1c2638] px-3 py-1 text-sm text-[#c5cfdc] hover:bg-[#26324a]`}
      >
        {t('back')}
      </button>
      <h3 className="mt-3 font-semibold">
        {load.status === 'ready' && load.data.setName ? load.data.setName : fallbackName}
      </h3>
      {load.status === 'loading' && <p className="mt-2 text-[#9aa7ba]">{t('loading')}</p>}
      {load.status === 'failed' && <p className="mt-2">{t('error')}</p>}
      {load.status === 'ready' && (
        <>
          <p className="mb-3 text-sm text-[#9aa7ba]">
            {load.data.boosters > 0
              ? t('boostersOpened', { count: load.data.boosters })
              : t('noBoosters')}
          </p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {load.data.drops.map(({ key, card, variant, pulls, rate }) => {
              const version = variantName(variant);
              return (
                <li key={key} className="flex flex-col gap-1">
                  <span
                    className={`aspect-[5/7] w-full overflow-hidden rounded-[4.5%/3.2%] ${
                      rate === null ? 'opacity-40 grayscale' : ''
                    }`}
                  >
                    <CardPicture name={card.name} imageUrl={card.imageUrl} quality="low" />
                  </span>
                  <span className="truncate text-xs text-[#c5cfdc]">
                    <span className="font-digits">#{card.localId}</span> {card.name}
                    {version && ` · ${version}`}
                  </span>
                  {rate === null ? (
                    <span className="text-xs text-[#9aa7ba] italic">{t('neverPulled')}</span>
                  ) : (
                    <span className="flex items-baseline justify-between gap-1 text-sm">
                      <span className="font-digits font-bold text-[#5fd39a]">
                        {format.number(rate, { style: 'percent', maximumFractionDigits: 1 })}
                      </span>
                      <span className="font-digits text-xs text-[#9aa7ba]">
                        {t('pulls', { count: pulls })}
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
