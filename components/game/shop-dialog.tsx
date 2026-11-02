'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { SetId } from '@/game/card-sets';
import type { ShopkeeperLine, ShopkeeperStock } from '@/game/shop-dialogue';
import { revealedLength } from '@/game/typewriter';
import { moveThroughChoices } from './menu-focus';

export const CHOICE_CLASS =
  'group flex w-full cursor-pointer items-center aria-disabled:cursor-wait gap-2 rounded-lg px-2 py-1.5 text-left text-lg font-medium outline-none hover:bg-ui-accent/40 focus-visible:bg-ui-accent/70';

export function ChoiceMarker() {
  return (
    <span
      aria-hidden="true"
      className="ui-nudge text-ui-accent-dark opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      ▶
    </span>
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
    <p className="min-h-14 text-xl leading-7 sm:min-h-0">
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
      className="ui-pop-in mx-auto mt-auto mb-4 w-[calc(100%-2rem)] max-w-2xl overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-transparent"
    >
      <h2
        id="shopkeeper-name"
        className="relative z-10 ml-5 w-fit -rotate-1 rounded-lg border-4 border-ui-ink bg-ui-accent px-4 py-0.5 text-lg font-semibold"
      >
        {t(`names.${stock}`)}
      </h2>
      <div className="-mt-3 rounded-2xl border-4 border-ui-ink bg-ui-paper px-5 pt-6 pb-3 shadow-[0_6px_0_var(--ui-ink)]">
        <TypedLine
          key={speech.turn}
          text={speech.line === 'greeting' ? t(`greetings.${stock}`) : t(speech.line)}
        />
        <form method="dialog" className="mt-2 border-ui-ink/20 border-t-2 pt-2">
          <div className="max-h-[35dvh] overflow-y-auto">
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
                <ChoiceMarker />
                {label}
              </button>
            ))}
          </div>
          <button type="submit" className={CHOICE_CLASS}>
            <ChoiceMarker />
            {t('leave')}
          </button>
        </form>
      </div>
    </dialog>
  );
}
