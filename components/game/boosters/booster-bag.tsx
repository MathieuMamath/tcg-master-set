'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { type BoosterLotSize, lotSizesFor } from '@/game/cards/booster-lots';
import type { PlayableSet, SetId } from '@/game/cards/card-sets';
import { moveThroughChoices, openDialog } from '../menu-focus';
import { CHOICE_CLASS, TornPaper } from '../shop/shop-dialog';
import { PackBody, PackEdge, packEdgeStyle } from './pack-art';

type Props = {
  boosters: readonly (PlayableSet & { count: number })[];
  // The sets whose binder the player bought: only their boosters can be opened.
  binders: readonly SetId[];
  // A booster to open, or a lot of five or ten of the same set.
  onPick: (setId: SetId, size: BoosterLotSize) => void;
  onClose: () => void;
};

export function BoosterBag({ boosters, binders, onPick, onClose }: Props) {
  const t = useTranslations('Booster');
  const dialog = useRef<HTMLDialogElement>(null);
  // Boosters won from quests or coupons wait in the bag until their binder is bought. Picking one
  // says why it can't be opened yet; the server refuses it too.
  const [lockedPick, setLockedPick] = useState<string | null>(null);

  useEffect(() => {
    openDialog(dialog.current);
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
        <p role="status" className="mt-2 min-h-6 text-center text-ui-danger">
          {lockedPick && t('needsBinder', { name: lockedPick })}
        </p>
        <div className="mt-1 flex max-h-[calc(100dvh-14rem)] flex-wrap justify-center gap-6 overflow-y-auto px-2 pt-4 pb-3">
          {boosters.map(({ id, name, logoUrl, count }) => {
            const isLocked = !binders.includes(id);
            // Five or ten at once, only when the bag holds that many.
            const lots = isLocked ? [] : lotSizesFor(count).filter((size) => size > 1);
            return (
              <div key={id} className="flex w-[min(40%,7.5rem)] flex-col items-center gap-2">
                <button
                  type="button"
                  aria-label={t(isLocked ? 'bagLocked' : 'bagCount', { name, count })}
                  aria-disabled={isLocked}
                  onClick={() => (isLocked ? setLockedPick(name) : onPick(id, 1))}
                  style={packEdgeStyle(id)}
                  className={`relative aspect-[5/7.6] w-full outline-none transition-transform focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-dashed focus-visible:outline-ui-stamp ${
                    isLocked
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer hover:-translate-y-1 focus-visible:-translate-y-1'
                  }`}
                >
                  <span className={`absolute inset-0 ${isLocked ? 'opacity-60 grayscale' : ''}`}>
                    <PackBody setId={id} setName={name} logoUrl={logoUrl} />
                    <PackEdge />
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute -top-2 -right-3 rotate-[4deg] ui-scrap bg-ui-accent px-2 font-semibold"
                  >
                    ×{count}
                  </span>
                  {isLocked && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-[-0.5rem] top-1/2 -translate-y-1/2 -rotate-6 ui-scrap bg-ui-paper px-1 py-0.5 text-center text-sm leading-tight font-semibold"
                    >
                      {t('lockedTag')}
                    </span>
                  )}
                </button>
                {lots.length > 0 && (
                  <div className="flex gap-1.5">
                    {lots.map((size) => (
                      <button
                        key={size}
                        type="button"
                        aria-label={t('openLot', { name, count: size })}
                        onClick={() => onPick(id, size)}
                        className="cursor-pointer ui-paper-button bg-ui-paper px-2.5 py-0.5 font-digits text-sm font-bold outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp"
                      >
                        ×{size}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
