'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { type ItemId, itemsIn, ownsItem, type ScarfId } from '@/game/avatar/items';
import type { AvatarSpecies } from '@/game/avatar/species';
import { pipAs } from '../art/pip';
import { moveThroughChoicesOnScreen, openDialog } from '../menu-focus';
import { CanvasArt } from '../shifts/shift';

type Props = {
  species: AvatarSpecies;
  scarf: ScarfId | null;
  ownedItems: readonly ItemId[];
  // Whether the last change could not be saved, and was taken back.
  hasFailed: boolean;
  onWear: (scarf: ScarfId) => void;
  onClose: () => void;
};

// The wardrobe in the bedroom, to get dressed: only the scarves the player has, each worn by their
// animal, the one worn marked. Choosing one puts it on at once. The others are bought at Maison
// Éventail, which the wardrobe reminds of while some are left to buy.
export function WardrobeDialog({ species, scarf, ownedItems, hasFailed, onWear, onClose }: Props) {
  const t = useTranslations('Wardrobe');
  const tScarves = useTranslations('FittingRoom.scarves');
  const dialog = useRef<HTMLDialogElement>(null);
  const scarves = itemsIn('scarf');
  const owned = scarves.filter((choice) => ownsItem(ownedItems, choice));

  useEffect(() => {
    openDialog(dialog.current);
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="wardrobe-title"
      onClose={onClose}
      onKeyDown={moveThroughChoicesOnScreen}
      className="ui-pop-in m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto bg-transparent px-0 pt-6 pr-2 pb-3 font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <div className="ui-sheet px-5 pb-5">
        <span aria-hidden="true" className="ui-paper-grain absolute inset-0 rounded-[0.8rem]" />
        <div className="relative">
          <div className="text-center">
            <h2
              id="wardrobe-title"
              className="-mb-2 ui-sheet-tag -translate-y-1/2 font-display text-xl leading-tight"
            >
              {t('title')}
            </h2>
          </div>
          <p className="text-center text-ui-ink/80">{t('hint')}</p>
          <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,8.5rem))] justify-center gap-3">
            {owned.map((choice) => {
              const isWorn = choice === scarf;
              return (
                <li key={choice}>
                  <button
                    type="button"
                    aria-pressed={isWorn}
                    data-first-focus={isWorn ? true : undefined}
                    onClick={() => {
                      if (!isWorn) {
                        onWear(choice);
                      }
                    }}
                    className="group relative flex w-full cursor-pointer flex-col items-center rounded-xl border-3 border-ui-ink/15 bg-[#fffdf7] px-1 pt-2 pb-1.5 outline-none transition-transform hover:-translate-y-0.5 hover:border-ui-ink/50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-pressed:border-ui-ink aria-pressed:bg-ui-accent/40"
                  >
                    <CanvasArt
                      draw={pipAs(species, choice)}
                      width={240}
                      height={300}
                      className="aspect-[4/5] w-full max-w-28"
                    />
                    <span className="text-center leading-tight font-semibold">
                      {tScarves(choice)}
                    </span>
                    {isWorn && (
                      <span className="absolute -top-2 -right-2 rotate-6 ui-scrap bg-ui-accent px-1.5 text-sm font-bold">
                        {t('worn')}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {owned.length < scarves.length && (
            <p className="mt-3 text-center text-sm text-ui-ink/70">{t('more')}</p>
          )}
          {hasFailed && (
            <p role="alert" className="mt-3 text-center font-semibold text-ui-stamp">
              {t('failed')}
            </p>
          )}
          <form method="dialog" className="mt-4 text-center">
            <button
              type="submit"
              className="cursor-pointer ui-paper-button bg-ui-paper px-4 py-1 font-semibold outline-offset-2 focus-visible:outline-2"
            >
              {t('close')}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}
