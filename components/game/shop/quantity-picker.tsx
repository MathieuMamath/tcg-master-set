'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from 'react';
import {
  BOOSTER_QUANTITY_PRESETS,
  clampBoosterQuantity,
  typedBoosterQuantity,
} from '@/game/cards/shop-dialogue';

const STEP_BUTTON_CLASS =
  'size-8 shrink-0 cursor-pointer touch-none select-none ui-paper-button bg-[#e6ece8] text-xl leading-none outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-disabled:cursor-not-allowed aria-disabled:opacity-40';

// Held down, a step button repeats, slowly at first and then faster, so that twenty boosters
// don't take twenty clicks. A click always counts once, through the button's own click, from a
// mouse, a finger or the keyboard alike: the hold only adds steps once it has lasted, and the
// click that ends a hold adds none.
const HOLD_MILLISECONDS = 400;
const FIRST_REPEAT_MILLISECONDS = 150;
const FASTEST_REPEAT_MILLISECONDS = 60;

function useHoldToRepeat(step: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRepeated = useRef(false);
  const latestStep = useRef(step);
  latestStep.current = step;

  const stop = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  // Nothing keeps repeating once the window is gone.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const start = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }
    stop();
    hasRepeated.current = false;
    let delay = FIRST_REPEAT_MILLISECONDS;
    const repeat = () => {
      hasRepeated.current = true;
      latestStep.current();
      delay = Math.max(FASTEST_REPEAT_MILLISECONDS, delay * 0.8);
      timer.current = setTimeout(repeat, delay);
    };
    timer.current = setTimeout(repeat, HOLD_MILLISECONDS);
  };

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    // A long press on a phone would otherwise open the browser's menu.
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
    onClick: () => {
      stop();
      if (hasRepeated.current) {
        hasRepeated.current = false;
        return;
      }
      latestStep.current();
    },
  };
}

type Props = {
  quantity: number;
  // The most boosters the player's coins pay for, at least one.
  most: number;
  onChange: (quantity: number) => void;
  // The field's id, for whoever sends the keyboard to it.
  fieldId?: string;
  // Enter in the field.
  onSubmit?: () => void;
  // Shown at the end of the stepper's line, such as the total to pay.
  children?: React.ReactNode;
};

// How many boosters to buy: a few counts in one touch, and a number to type or step through,
// the step buttons repeating while held. Up and Down step by one in the field, Page Up and Page
// Down by ten.
export function QuantityPicker({ quantity, most, onChange, fieldId, onSubmit, children }: Props) {
  const t = useTranslations('Shopkeeper.window');
  // What the field shows while the player types, which may be empty for a moment.
  const [typed, setTyped] = useState<string | null>(null);
  // Read by the repeating buttons, which outlive the render they started in.
  const quantityRef = useRef(quantity);
  quantityRef.current = quantity;
  const set = (next: number) => {
    setTyped(null);
    quantityRef.current = clampBoosterQuantity(next, most);
    onChange(quantityRef.current);
  };
  const less = useHoldToRepeat(() => set(quantityRef.current - 1));
  const more = useHoldToRepeat(() => set(quantityRef.current + 1));

  const onFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const steps: Record<string, number> = { ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      event.preventDefault();
      event.stopPropagation();
      setTyped(null);
      onSubmit?.();
      return;
    }
    const step = steps[event.code];
    if (step !== undefined) {
      event.preventDefault();
      event.stopPropagation();
      set(quantity + step);
    }
  };

  const choices = [
    ...BOOSTER_QUANTITY_PRESETS.map((count) => ({ count, isMax: false })),
    { count: most, isMax: true },
  ];

  return (
    <fieldset className="grid min-w-0 gap-2">
      <legend className="sr-only">{t('quantity')}</legend>
      <div className="flex flex-wrap gap-1.5">
        {choices.map(({ count, isMax }) => {
          const isOut = count > most;
          const isChosen = count === quantity;
          return (
            <button
              key={isMax ? 'max' : count}
              type="button"
              aria-pressed={isChosen}
              aria-disabled={isOut}
              aria-label={isMax ? t('maxLabel', { count }) : t('presetLabel', { count })}
              onClick={() => {
                if (!isOut) {
                  set(count);
                }
              }}
              className="min-w-10 cursor-pointer rounded-full border-2 border-ui-ink/25 bg-ui-paper px-2.5 py-0.5 font-digits text-sm font-bold outline-none hover:border-ui-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-disabled:cursor-not-allowed aria-disabled:opacity-35 aria-disabled:hover:border-ui-ink/25 aria-pressed:border-ui-ink aria-pressed:bg-ui-accent"
            >
              {isMax ? t('max') : `×${count}`}
            </button>
          );
        })}
      </div>
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          aria-label={t('less')}
          aria-disabled={quantity <= 1}
          {...less}
          className={STEP_BUTTON_CLASS}
        >
          −
        </button>
        <input
          id={fieldId}
          type="text"
          inputMode="numeric"
          enterKeyHint="done"
          aria-label={t('quantity')}
          value={typed ?? String(quantity)}
          onChange={(event) => {
            const next = typedBoosterQuantity(event.target.value, most);
            setTyped(event.target.value.replace(/\D/g, '').slice(0, 2));
            if (next !== null) {
              onChange(next);
            }
          }}
          onBlur={() => setTyped(null)}
          onFocus={(event) => event.target.select()}
          onKeyDown={onFieldKeyDown}
          maxLength={2}
          className="w-11 rounded-lg border-2 border-ui-ink/25 bg-[#fffdf7] py-0.5 text-center font-digits text-xl font-bold outline-none focus:border-ui-ink focus:shadow-[0_0_0_3px_rgb(243_193_75/70%)]"
        />
        <button
          type="button"
          aria-label={t('more')}
          aria-disabled={quantity >= most}
          {...more}
          className={STEP_BUTTON_CLASS}
        >
          +
        </button>
        {children && <div className="ml-auto pl-2">{children}</div>}
      </div>
    </fieldset>
  );
}
