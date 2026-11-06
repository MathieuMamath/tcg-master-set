'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { SetId } from '@/game/card-sets';
import {
  BINDER_PRICE,
  BOOSTER_PRICE,
  type ShopkeeperLine,
  type ShopkeeperStock,
} from '@/game/shop-dialogue';
import { revealedLength } from '@/game/typewriter';
import { focusFirstChoice, moveThroughChoices, openDialog } from './menu-focus';
import { reportPlay } from './report';
import { SellerPortrait } from './seller-portrait';
import { type ShopItem, ShopWindow } from './shop-window';

// A choice is a small scrap of paper, each one tilted the other way from the one before.
export const CHOICE_CLASS =
  'inline-flex cursor-pointer items-center rounded-xs bg-[#e6ece8] px-3.5 pt-1.5 pb-1 text-left text-lg text-ui-ink shadow-[2px_3px_0_var(--ui-shadow)] outline-none transition-transform odd:-rotate-[0.8deg] even:rotate-[0.8deg] hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-disabled:cursor-wait';

type SpeechBoxProps = {
  nameId: string;
  name: string;
  // What the speaker does, written small beside the name.
  title?: string;
  // The speaker's face, or her initial while she has no drawing.
  portrait?: ReactNode;
  children: ReactNode;
};

// A scrap of torn paper taped down, the look of every dialog.
export function TornPaper({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className="relative -rotate-[0.5deg] drop-shadow-[4px_5px_0_var(--ui-shadow)]">
      <span
        aria-hidden="true"
        className="absolute -top-2.5 left-[28%] z-10 h-5 w-[4.4rem] -rotate-[4deg] bg-(--ui-tape)"
      />
      <div className={`ui-torn bg-ui-paper ${className}`}>{children}</div>
    </div>
  );
}

// The scrap of torn paper where a character talks, with a round portrait on its left.
export function SpeechBox({ nameId, name, title, portrait, children }: SpeechBoxProps) {
  return (
    <TornPaper className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-4 pt-4 pb-5 sm:gap-[1.125rem] sm:px-6 sm:pt-5 sm:pb-6">
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center overflow-hidden rounded-full border-3 border-ui-paper bg-[#e7d9bc] font-display text-2xl text-ui-ink/40 ring-2 ring-[#8e6b3e] sm:size-26 sm:text-5xl"
      >
        {portrait ?? name.charAt(0)}
      </span>
      <div className="min-w-0">
        <h2 id={nameId} className="font-display text-lg">
          {name}
          {title && (
            <>
              {' '}
              <small className="ml-1 font-game text-base text-ui-ink/65">{title}</small>
            </>
          )}
        </h2>
        {children}
      </div>
    </TornPaper>
  );
}

// Mounted anew for each line, so that it always starts typing from the beginning.
export function TypedLine({ text }: { text: string }) {
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLength(text.length);
      return;
    }

    const start = performance.now();
    let frame = requestAnimationFrame(function reveal(now) {
      const revealed = revealedLength(now - start, text.length);
      setLength(revealed);
      if (revealed < text.length) {
        frame = requestAnimationFrame(reveal);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [text]);

  return (
    // Phones keep room for two lines, so that the dialog doesn't change size from one line to the next.
    <p className="mt-1 min-h-14 text-xl leading-snug sm:min-h-[3.5em]">
      <span className="sr-only" aria-live="polite">
        {text}
      </span>
      <span aria-hidden="true">
        {text.slice(0, length)}
        <span className="invisible">{text.slice(length)}</span>
      </span>
    </p>
  );
}

type Props = {
  stock: ShopkeeperStock | 'binderSeller';
  items: readonly ShopItem[];
  coins: number;
  onBuy: (setId: SetId, quantity: number) => Promise<ShopkeeperLine>;
  onClose: () => void;
};

// Mounted only while talking, so every conversation starts with a greeting. The seller offers to
// show what she sells, which opens her shop window in the same dialog.
export function ShopDialog({ stock, items, coins, onBuy, onClose }: Props) {
  const t = useTranslations('Shopkeeper');
  const dialog = useRef<HTMLDialogElement>(null);
  const [speech, setSpeech] = useState<{ line: ShopkeeperLine; turn: number }>({
    line: 'greeting',
    turn: 0,
  });
  const [isBrowsing, setIsBrowsing] = useState(false);
  const hasBought = useRef(false);
  const kind = stock === 'binderSeller' ? 'binder' : 'booster';
  const name = stock === 'binderSeller' ? t('names.binderSeller') : t(`sellers.${stock}`);
  const title = t(`titles.${stock}`);

  useEffect(() => {
    openDialog(dialog.current);
  }, []);

  // Back from the window to the conversation, where the seller thanks the player if they bought
  // something.
  const stopBrowsing = () => {
    setIsBrowsing(false);
    setSpeech(({ turn }) => ({ line: hasBought.current ? 'thanks' : 'greeting', turn: turn + 1 }));
    requestAnimationFrame(() => dialog.current && focusFirstChoice(dialog.current));
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby={isBrowsing ? 'shop-window-title' : 'shopkeeper-name'}
      onClose={onClose}
      onCancel={(event) => {
        // Escape closes the window first, then the conversation.
        if (isBrowsing) {
          event.preventDefault();
          stopBrowsing();
        }
      }}
      onKeyDown={isBrowsing ? undefined : moveThroughChoices}
      className={`ui-pop-in max-w-none overflow-visible bg-transparent font-game text-ui-ink ${
        isBrowsing
          ? 'm-auto w-[min(60rem,calc(100%-1rem))] backdrop:bg-ui-ink/50'
          : 'mx-auto mt-auto mb-4 w-[min(41.25rem,calc(100%-2rem))] backdrop:bg-transparent'
      }`}
    >
      {isBrowsing ? (
        <ShopWindow
          kind={kind}
          seller={{ stock, name, title }}
          items={items}
          coins={coins}
          price={kind === 'binder' ? BINDER_PRICE : BOOSTER_PRICE}
          onBuy={async (setId, quantity) => {
            const line = await onBuy(setId, quantity);
            if (line === 'thanks') {
              hasBought.current = true;
            }
            return line;
          }}
          onBack={stopBrowsing}
        />
      ) : (
        <SpeechBox
          nameId="shopkeeper-name"
          name={name}
          title={title}
          portrait={<SellerPortrait stock={stock} />}
        >
          <TypedLine
            key={speech.turn}
            text={
              speech.line === 'greeting' || speech.line === 'thanks'
                ? t(`${speech.line === 'greeting' ? 'greetings' : 'thanks'}.${stock}`)
                : t(speech.line)
            }
          />
          <form method="dialog" className="mt-2.5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                reportPlay({ type: 'shop.viewed', stock });
                setIsBrowsing(true);
              }}
              className={`${CHOICE_CLASS} bg-ui-stamp text-ui-paper`}
            >
              {t(`browse.${stock}`)}
            </button>
            <button type="submit" className={CHOICE_CLASS}>
              {t(`nothing.${stock}`)}
            </button>
          </form>
        </SpeechBox>
      )}
    </dialog>
  );
}
