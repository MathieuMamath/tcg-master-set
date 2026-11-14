'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  type BoutiqueLine,
  type HatId,
  ITEMS,
  type ItemId,
  itemsIn,
  ownsItem,
  type ScarfId,
} from '@/game/avatar/items';
import type { AvatarSpecies } from '@/game/avatar/species';
import type { Wallet } from '@/game/cards/shop-dialogue';
import { pipAs } from '../art/pip';
import { moveThroughChoicesOnScreen, openDialog } from '../menu-focus';
import { CanvasArt } from '../shifts/shift';

// The slots a shop sells, and where it lets the player try them on.
export type ShopSlot = 'scarf' | 'hat';
export type FittingShop = 'boutique' | 'hatter';

type Props = {
  shop: FittingShop;
  slot: ShopSlot;
  species: AvatarSpecies;
  // What is worn, and the items bought.
  scarf: ScarfId | null;
  hat: HatId | null;
  ownedItems: readonly ItemId[];
  coins: number;
  // What the server decided after a purchase: the coins left, and the items owned and worn.
  onBought: (
    wallet: Wallet,
    look: { scarf: ScarfId | null; hat: HatId | null; ownedItems: ItemId[] },
  ) => void;
  onWorn: (slot: ShopSlot, item: ItemId) => void;
  onClose: () => void;
};

// What the mirror says under it, after the player did something.
type Note = BoutiqueLine | 'worn' | 'unavailable';

// A shop's fitting room: the player's character in the mirror, wearing whichever item of the shop's
// slot they try, with the rest of what they wear. An item they have is put on at once; one they
// don't, bought, and then worn.
export function FittingRoomDialog({
  shop,
  slot,
  species,
  scarf,
  hat,
  ownedItems,
  coins,
  onBought,
  onWorn,
  onClose,
}: Props) {
  const t = useTranslations('FittingRoom');
  const tItems = useTranslations('Items');
  const dialog = useRef<HTMLDialogElement>(null);
  const choices: ItemId[] = itemsIn(slot);
  const worn: ItemId | null = slot === 'scarf' ? scarf : hat;
  const [tried, setTried] = useState<ItemId>(worn ?? choices[0]);
  const [note, setNote] = useState<Note | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const isOwned = ownsItem(ownedItems, tried);
  const isWorn = tried === worn;
  const price = ITEMS[tried].price;
  const canAfford = coins >= price;
  // The character wearing an item of this slot, with the rest of what they wear.
  const wearing = (item: ItemId) =>
    pipAs(
      species,
      slot === 'scarf' ? (item as ScarfId) : scarf,
      slot === 'hat' ? (item as HatId) : hat,
    );

  useEffect(() => {
    openDialog(dialog.current);
  }, []);

  const wear = async () => {
    setIsBusy(true);
    try {
      const response = await fetch('/api/player/look', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, item: tried }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      onWorn(slot, tried);
      setNote('worn');
    } catch {
      setNote('unavailable');
    } finally {
      setIsBusy(false);
    }
  };

  const buy = async () => {
    if (!canAfford) {
      setNote('notEnoughCoins');
      return;
    }
    setIsBusy(true);
    try {
      const response = await fetch('/api/boutique/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: tried }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { wallet, look, line } = await response.json();
      onBought(wallet, look);
      setNote(line);
    } catch {
      setNote('unavailable');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="fitting-room-title"
      onClose={onClose}
      onKeyDown={moveThroughChoicesOnScreen}
      className="ui-pop-in m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto bg-transparent px-0 pt-6 pr-2 pb-3 font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <div className="ui-sheet px-5 pb-5">
        <span aria-hidden="true" className="ui-paper-grain absolute inset-0 rounded-[0.8rem]" />
        <div className="relative">
          <div className="text-center">
            <h2
              id="fitting-room-title"
              className="-mb-2 ui-sheet-tag -translate-y-1/2 font-display text-xl leading-tight"
            >
              {t(`${shop}.title`)}
            </h2>
          </div>
          <p className="text-center text-ui-ink/80">{t(`${shop}.hint`)}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
            {/* The mirror, with the character wearing the item tried on. */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex w-full max-w-56 justify-center rounded-[50%/40%] border-6 border-[#d9aa3f] bg-[#dcecef] px-4 pt-4 pb-2">
                <CanvasArt
                  draw={wearing(tried)}
                  width={240}
                  height={300}
                  className="aspect-[4/5] w-full max-w-44"
                />
              </div>
              <p className="font-display text-lg leading-tight">{tItems(tried)}</p>
              <div className="flex min-h-10 flex-col items-center">
                {isWorn ? (
                  <p className="font-semibold text-ui-ink/70">{t('wearing', { slot })}</p>
                ) : isOwned ? (
                  <button
                    type="button"
                    aria-disabled={isBusy}
                    onClick={() => {
                      if (!isBusy) {
                        wear();
                      }
                    }}
                    className="cursor-pointer ui-paper-button bg-ui-accent px-4 py-1 font-semibold outline-offset-2 focus-visible:outline-2 aria-disabled:cursor-wait aria-disabled:opacity-60"
                  >
                    {t('wear', { slot })}
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-disabled={isBusy || !canAfford}
                    onClick={() => {
                      if (!isBusy) {
                        buy();
                      }
                    }}
                    className="cursor-pointer ui-paper-button bg-ui-stamp px-4 py-1 font-semibold text-ui-paper outline-offset-2 focus-visible:outline-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
                  >
                    {t('buy', { price, slot })}
                  </button>
                )}
              </div>
              <p role="status" className="min-h-6 text-center text-sm font-semibold">
                {note && t(`notes.${note}`, { slot })}
              </p>
            </div>
            {/* Every item of the shop, to try on. */}
            <ul className="grid grid-cols-2 content-start gap-2.5 sm:grid-cols-3">
              {choices.map((choice) => {
                const isChoiceOwned = ownsItem(ownedItems, choice);
                return (
                  <li key={choice}>
                    <button
                      type="button"
                      aria-pressed={choice === tried}
                      data-first-focus={choice === (worn ?? choices[0]) ? true : undefined}
                      onClick={() => {
                        setTried(choice);
                        setNote(null);
                      }}
                      className="relative flex w-full cursor-pointer flex-col items-center rounded-xl border-3 border-ui-ink/15 bg-[#fffdf7] px-1 pt-1.5 pb-1 outline-none transition-transform hover:-translate-y-0.5 hover:border-ui-ink/50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-pressed:border-ui-ink aria-pressed:bg-ui-accent/40"
                    >
                      <CanvasArt
                        draw={wearing(choice)}
                        width={240}
                        height={300}
                        className="aspect-[4/5] w-full max-w-20"
                      />
                      <span className="text-center leading-tight font-semibold">
                        {tItems(choice)}
                      </span>
                      <span className="font-digits text-sm whitespace-nowrap text-ui-ink/70">
                        {choice === worn
                          ? t('worn', { slot })
                          : isChoiceOwned
                            ? t('owned')
                            : t('price', { price: ITEMS[choice].price })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <form method="dialog" className="mt-4 text-center">
            <button
              type="submit"
              className="cursor-pointer ui-paper-button bg-ui-paper px-4 py-1 font-semibold outline-offset-2 focus-visible:outline-2"
            >
              {t(`${shop}.close`)}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}
