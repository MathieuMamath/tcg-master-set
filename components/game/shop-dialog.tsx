'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { SetId } from '@/game/card-sets';
import type { ShopkeeperLine, ShopkeeperStock } from '@/game/shop-dialogue';
import { revealedLength } from '@/game/typewriter';
import { moveThroughChoices } from './menu-focus';
import { SellerPortrait } from './seller-portrait';

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

// The scrap of torn paper where a character talks, with a round portrait on its left.
export function SpeechBox({ nameId, name, title, portrait, children }: SpeechBoxProps) {
  return (
    <div className="relative -rotate-[0.5deg] drop-shadow-[4px_5px_0_var(--ui-shadow)]">
      <span
        aria-hidden="true"
        className="absolute -top-2.5 left-[28%] z-10 h-5 w-[4.4rem] -rotate-[4deg] bg-(--ui-tape)"
      />
      <div className="ui-torn grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 bg-ui-paper px-4 pt-4 pb-5 sm:gap-[1.125rem] sm:px-6 sm:pt-5 sm:pb-6">
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
      </div>
    </div>
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

export type ShopChoice = { setId: SetId; label: string; isUnavailable?: boolean };

type Props = {
  stock: ShopkeeperStock | 'binderSeller';
  choices: readonly ShopChoice[];
  onBuy: (setId: SetId) => Promise<ShopkeeperLine>;
  onClose: () => void;
};

// Mounted only while talking, so every conversation starts with a greeting.
export function ShopDialog({ stock, choices, onBuy, onClose }: Props) {
  const t = useTranslations('Shopkeeper');
  const dialog = useRef<HTMLDialogElement>(null);
  const [speech, setSpeech] = useState<{ line: ShopkeeperLine; turn: number }>({
    line: 'greeting',
    turn: 0,
  });

  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
    // The first choice that can be pressed, past any binder already bought.
    dialog.current?.querySelector<HTMLElement>('button[aria-disabled="false"]')?.focus();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="shopkeeper-name"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in mx-auto mt-auto mb-4 w-[min(41.25rem,calc(100%-2rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-transparent"
    >
      <SpeechBox
        nameId="shopkeeper-name"
        name={stock === 'binderSeller' ? t('names.binderSeller') : t(`sellers.${stock}`)}
        title={stock === 'binderSeller' ? undefined : t(`titles.${stock}`)}
        portrait={stock === 'binderSeller' ? undefined : <SellerPortrait stock={stock} />}
      >
        <TypedLine
          key={speech.turn}
          text={speech.line === 'greeting' ? t(`greetings.${stock}`) : t(speech.line)}
        />
        <form method="dialog" className="mt-2.5">
          <div className="-m-1 flex max-h-[35dvh] flex-wrap gap-2.5 overflow-y-auto p-1">
            {choices.map(({ setId, label, isUnavailable = false }) => (
              <button
                key={setId}
                type="button"
                className={`${CHOICE_CLASS} ${isUnavailable ? 'opacity-50' : ''}`}
                // Not `disabled`, which would take the focus away from the keyboard.
                aria-disabled={isBuying || isUnavailable}
                onClick={async () => {
                  if (isBuying || isUnavailable) {
                    return;
                  }
                  setIsBuying(true);
                  const line = await onBuy(setId);
                  setIsBuying(false);
                  setSpeech(({ turn }) => ({ line, turn: turn + 1 }));
                }}
              >
                {label}
              </button>
            ))}
            <button type="submit" className={CHOICE_CLASS}>
              {t('leave')}
            </button>
          </div>
        </form>
      </SpeechBox>
    </dialog>
  );
}
