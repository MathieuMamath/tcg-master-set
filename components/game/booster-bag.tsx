'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import type { PlayableSet, SetId } from '@/game/card-sets';
import { moveThroughChoices } from './menu-focus';
import { PackBody, PackEdge, packEdgeStyle } from './pack-art';
import { CHOICE_CLASS, TornPaper } from './shop-dialog';

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
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto w-[min(42rem,calc(100%-2rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="px-4 pt-5 pb-6 sm:px-6">
        <h2 id="booster-bag-title" className="text-center font-display text-xl">
          {t('bagTitle')}
        </h2>
        <div className="mt-3 flex max-h-[calc(100dvh-14rem)] flex-wrap justify-center gap-6 overflow-y-auto px-2 pt-4 pb-3">
          {boosters.map(({ id, name, logoUrl, count }) => (
            <button
              key={id}
              type="button"
              aria-label={t('bagCount', { name, count })}
              onClick={() => onPick(id)}
              style={packEdgeStyle(id)}
              className="relative aspect-[5/7.6] w-[min(40%,7.5rem)] cursor-pointer outline-none transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-dashed focus-visible:outline-ui-stamp"
            >
              <PackBody setId={id} setName={name} logoUrl={logoUrl} />
              <PackEdge />
              <span
                aria-hidden="true"
                className="absolute -top-2 -right-3 rotate-[4deg] ui-scrap bg-ui-accent px-2 font-semibold"
              >
                ×{count}
              </span>
            </button>
          ))}
        </div>
        <form method="dialog" className="mt-3 flex justify-center">
          <button type="submit" className={CHOICE_CLASS}>
            {t('back')}
          </button>
        </form>
      </TornPaper>
    </dialog>
  );
}
