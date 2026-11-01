'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import type { PlayableSet, SetId } from '@/game/card-sets';
import { PackBody, packCrimpStyle } from './pack-art';

type Props = {
  boosters: readonly (PlayableSet & { count: number })[];
  onPick: (setId: SetId) => void;
  onClose: () => void;
};

export function BoosterBag({ boosters, onPick, onClose }: Props) {
  const t = useTranslations('Booster');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="booster-bag-title"
      onClose={onClose}
      className="ui-pop-in m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-4 border-ui-ink bg-ui-paper p-5 font-game text-ui-ink shadow-[0_6px_0_var(--ui-ink)] backdrop:bg-ui-ink/50"
    >
      <h2 id="booster-bag-title" className="text-center text-xl font-semibold">
        {t('bagTitle')}
      </h2>
      <div className="mt-4 flex flex-wrap justify-center gap-5 pt-1 pr-1">
        {boosters.map(({ id, name, logoUrl, count }) => (
          <button
            key={id}
            type="button"
            aria-label={t('bagCount', { name, count })}
            onClick={() => onPick(id)}
            style={packCrimpStyle(id)}
            className="relative aspect-[5/7.6] w-[min(40%,7.5rem)] cursor-pointer rounded-md outline-offset-4 transition-transform hover:-translate-y-1 focus-visible:-translate-y-1"
          >
            <PackBody setId={id} setName={name} logoUrl={logoUrl} />
            <span
              aria-hidden="true"
              className="ui-pack-crimp absolute inset-x-0 top-0 h-[13%] rounded-t-md border-4 border-b-0 border-ui-ink"
            />
            <span
              aria-hidden="true"
              className="absolute -top-2 -right-2 rounded-full border-3 border-ui-ink bg-ui-accent px-2 font-semibold"
            >
              ×{count}
            </span>
          </button>
        ))}
      </div>
      <form method="dialog" className="mt-5 text-center">
        <button type="submit" className="cursor-pointer font-semibold underline">
          {t('back')}
        </button>
      </form>
    </dialog>
  );
}
