'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { type HatId, type ItemId, itemsIn, ownsItem, type ScarfId } from '@/game/avatar/items';
import type { AvatarSpecies } from '@/game/avatar/species';
import { pipAs } from '../art/pip';
import { moveThroughChoicesOnScreen, openDialog } from '../menu-focus';
import { CanvasArt } from '../shifts/shift';
import type { ShopSlot } from './fitting-room-dialog';

type Props = {
  species: AvatarSpecies;
  scarf: ScarfId | null;
  hat: HatId | null;
  ownedItems: readonly ItemId[];
  // Whether the last change could not be saved, and was taken back.
  hasFailed: boolean;
  // An item to put on in its slot, or nothing to take the hat off.
  onWear: (slot: ShopSlot, item: ItemId | null) => void;
  onClose: () => void;
};

const CARD_CLASS =
  'group relative flex w-full cursor-pointer flex-col items-center rounded-xl border-3 border-ui-ink/15 bg-[#fffdf7] px-1 pt-2 pb-1.5 outline-none transition-transform hover:-translate-y-0.5 hover:border-ui-ink/50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-pressed:border-ui-ink aria-pressed:bg-ui-accent/40';

// The wardrobe in the bedroom, to get dressed: a shelf for each slot, from the head down, with only the items the
// player has, each worn by their animal, the ones worn marked, and the hat can be taken off.
// Choosing one puts it on at once. The others are bought in the shops downtown, which the wardrobe
// reminds of while some are left to buy.
export function WardrobeDialog({
  species,
  scarf,
  hat,
  ownedItems,
  hasFailed,
  onWear,
  onClose,
}: Props) {
  const t = useTranslations('Wardrobe');
  const tItems = useTranslations('Items');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    openDialog(dialog.current);
  }, []);

  const shelf = (slot: ShopSlot) => {
    const all: ItemId[] = itemsIn(slot);
    const owned = all.filter((choice) => ownsItem(ownedItems, choice));
    const worn: ItemId | null = slot === 'scarf' ? scarf : hat;
    // The character wearing an item of this shelf, or nothing on the head.
    const wearing = (item: ItemId | null) =>
      pipAs(
        species,
        slot === 'scarf' ? (item as ScarfId) : scarf,
        slot === 'hat' ? (item as HatId | null) : hat,
      );
    const choices: (ItemId | null)[] = slot === 'hat' ? [null, ...owned] : owned;
    return (
      <section aria-labelledby={`wardrobe-${slot}`} className="mt-4">
        <h3 id={`wardrobe-${slot}`} className="font-display text-lg">
          {t(`shelves.${slot}`)}
        </h3>
        <ul className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
          {choices.map((choice) => {
            const isWorn = choice === worn;
            return (
              <li key={choice ?? 'none'}>
                <button
                  type="button"
                  aria-pressed={isWorn}
                  data-first-focus={slot === 'hat' && isWorn ? true : undefined}
                  onClick={() => {
                    if (!isWorn) {
                      onWear(slot, choice);
                    }
                  }}
                  className={CARD_CLASS}
                >
                  <CanvasArt
                    draw={wearing(choice)}
                    width={240}
                    height={300}
                    className="aspect-[4/5] w-full max-w-24"
                  />
                  <span className="text-center leading-tight font-semibold">
                    {choice ? tItems(choice) : t('noHat')}
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
        {owned.length < all.length && (
          <p className="mt-2 text-sm text-ui-ink/70">{t(`more.${slot}`)}</p>
        )}
      </section>
    );
  };

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
          {shelf('hat')}
          {shelf('scarf')}
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
