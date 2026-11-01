'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { PlayableSet, SetId } from '@/game/card-sets';
import { BOOSTER_PRICE, type ShopkeeperLine, type ShopkeeperStock } from '@/game/shop-dialogue';
import { revealedLength } from '@/game/typewriter';

const CHOICE_CLASS =
  'group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-lg font-medium outline-none hover:bg-ui-accent/40 focus-visible:bg-ui-accent/70';

function ChoiceMarker() {
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
function TypedLine({ text }: { text: string }) {
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
    <p className="min-h-14 text-xl leading-7">
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
  stock: ShopkeeperStock;
  sets: readonly PlayableSet[];
  onBuy: (setId: SetId) => ShopkeeperLine;
  onClose: () => void;
};

// Mounted only while talking, so every conversation starts with a greeting.
export function ShopDialog({ stock, sets, onBuy, onClose }: Props) {
  const t = useTranslations('Shopkeeper');
  const dialog = useRef<HTMLDialogElement>(null);
  const [speech, setSpeech] = useState<{ line: ShopkeeperLine; turn: number }>({
    line: 'greeting',
    turn: 0,
  });

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // Choices are picked like in a game menu, with the same keys used to walk.
  const moveThroughChoices = (event: KeyboardEvent) => {
    const step = { ArrowUp: -1, KeyW: -1, ArrowDown: 1, KeyS: 1 }[event.code];
    if (!step) {
      return;
    }
    event.preventDefault();
    const choices = Array.from(dialog.current?.querySelectorAll('button') ?? []);
    const current = choices.indexOf(document.activeElement as HTMLButtonElement);
    choices[(current + step + choices.length) % choices.length]?.focus();
  };

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
            {sets.map(({ id, name }) => (
              <button
                key={id}
                type="button"
                className={CHOICE_CLASS}
                onClick={() => {
                  const line = onBuy(id);
                  setSpeech(({ turn }) => ({ line, turn: turn + 1 }));
                }}
              >
                <ChoiceMarker />
                {t('buy', { set: name, price: BOOSTER_PRICE })}
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
