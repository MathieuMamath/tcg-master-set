'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { MemoryCard } from '@/cards/memory-cards';
import {
  MEMORY_CARD_COUNT,
  MEMORY_MOVE_LIMIT,
  MEMORY_PAIRS,
  type MemoryStatus,
} from '@/game/memory-game';
import { horizontalStep, verticalStep } from '@/game/menu-keys';
import type { Wallet } from '@/game/shop-dialogue';
import type { MemoryFlipAnswer } from '@/player/progress';
import { CardBack } from './card-back';
import { CardPicture } from './card-picture';
import { SellerPortrait } from './seller-portrait';
import { CHOICE_CLASS, TornPaper } from './shop-dialog';

const COLUMNS = 4;
// Long enough to remember two different cards before they turn back.
const SHOWN_MILLISECONDS = 1100;

// Moves left from which the counter turns red.
const FEW_MOVES = 5;

const POSITIONS = Array.from({ length: MEMORY_CARD_COUNT }, (_, position) => position);

type Props = {
  cards: readonly MemoryCard[];
  // Called once with how the game ended, or with null when it couldn't go on.
  onEnd: (ending: { status: MemoryStatus; wallet: Wallet } | null) => void;
  onGiveUp: () => void;
};

// The server knows the board, so each flipped card is a question to it. The answers are only shown.
export function MemoryDialog({ cards, onEnd, onGiveUp }: Props) {
  const t = useTranslations('Quest.memory');
  const dialog = useRef<HTMLDialogElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const isBusy = useRef(false);
  const firstFlip = useRef<number | null>(null);
  const waiting = useRef<ReturnType<typeof setTimeout>>(undefined);
  // What each position showed last, kept while a card turns back.
  const [faces, setFaces] = useState<(number | null)[]>(() => POSITIONS.map(() => null));
  const [faceUp, setFaceUp] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    dialog.current?.showModal();
    buttons.current[0]?.focus();
    return () => clearTimeout(waiting.current);
  }, []);

  // So that a flipped card shows at once, rather than when its picture has arrived.
  useEffect(() => {
    for (const { imageUrl } of cards) {
      if (imageUrl) {
        new Image().src = `${imageUrl}/low.webp`;
      }
    }
  }, [cards]);

  const flip = async (position: number) => {
    if (isBusy.current || found.includes(position) || firstFlip.current === position) {
      return;
    }
    isBusy.current = true;

    let answer: MemoryFlipAnswer;
    try {
      const response = await fetch(`/api/quests/grandpa/flip?position=${position}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      answer = await response.json();
    } catch {
      onEnd(null);
      return;
    }

    setFaces((current) => current.map((face, at) => (at === position ? answer.face : face)));
    setMoves(answer.moves);
    const first = firstFlip.current;
    if (first === null) {
      firstFlip.current = position;
      setFaceUp([position]);
      isBusy.current = false;
      return;
    }
    firstFlip.current = null;
    setFaceUp([first, position]);
    if (answer.isMatch) {
      setFound((current) => [...current, first, position]);
    }

    waiting.current = setTimeout(() => {
      setFaceUp([]);
      isBusy.current = false;
      if (answer.status !== 'playing') {
        onEnd({ status: answer.status, wallet: answer.wallet });
      }
    }, SHOWN_MILLISECONDS);
  };

  const moveOnBoard = (event: KeyboardEvent<HTMLButtonElement>, position: number) => {
    const rowStep = verticalStep(event.code);
    const columnStep = horizontalStep(event.code);
    if (!rowStep && !columnStep) {
      return;
    }
    event.preventDefault();
    const row = Math.floor(position / COLUMNS);
    const column = position % COLUMNS;
    const rows = MEMORY_CARD_COUNT / COLUMNS;
    const nextRow = (row + (rowStep ?? 0) + rows) % rows;
    const nextColumn = (column + (columnStep ?? 0) + COLUMNS) % COLUMNS;
    buttons.current[nextRow * COLUMNS + nextColumn]?.focus();
  };

  const labelOf = (position: number) => {
    const name = cards[faces[position] ?? -1]?.name ?? '';
    const number = position + 1;
    if (found.includes(position)) {
      return t('foundCard', { number, name });
    }
    return faceUp.includes(position)
      ? t('shownCard', { number, name })
      : t('hiddenCard', { number });
  };

  const movesLeft = MEMORY_MOVE_LIMIT - moves;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="memory-title"
      onClose={onGiveUp}
      className="ui-pop-in m-auto max-h-dvh w-[min(calc(100%-1rem),calc(52dvh+3rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-11 shrink-0 overflow-hidden rounded-full border-3 border-ui-paper bg-[#e7d9bc] ring-2 ring-[#8e6b3e]"
          >
            <SellerPortrait stock="grandpa" />
          </span>
          <h2 id="memory-title" className="flex-1 font-display text-lg leading-tight">
            {t('title')}
          </h2>
        </div>
        {/* The counters, on scraps of paper: moves left, and the pairs found as stars. */}
        <div aria-live="polite" className="mt-2.5 flex flex-wrap items-center gap-2.5">
          <p
            className={`-rotate-1 ui-scrap px-2.5 py-0.5 tabular-nums ${
              movesLeft <= FEW_MOVES ? 'bg-ui-stamp text-ui-paper' : ''
            }`}
          >
            {t('moves', { moves, limit: MEMORY_MOVE_LIMIT })}
          </p>
          <p className="flex rotate-1 items-center gap-1.5 ui-scrap px-2.5 py-0.5">
            <span className="sr-only">
              {t('pairs', { found: found.length / 2, total: MEMORY_PAIRS })}
            </span>
            {Array.from({ length: MEMORY_PAIRS }, (_, pair) => (
              <svg
                // biome-ignore lint/suspicious/noArrayIndexKey: the stars are only counted.
                key={pair}
                aria-hidden="true"
                viewBox="0 0 20 20"
                className={`size-4 ${pair < found.length / 2 ? 'ui-pop-in' : 'opacity-25'}`}
              >
                <path
                  d="M10 1.5 12.6 7l6 .7-4.4 4.1 1.2 5.9L10 14.8 4.6 17.7l1.2-5.9L1.4 7.7l6-.7Z"
                  fill={pair < found.length / 2 ? '#f3c14b' : '#2c2a35'}
                />
              </svg>
            ))}
          </p>
        </div>
        {/* The cards, laid out on the planks of Papy's bench. */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-md bg-[repeating-linear-gradient(#a8743f_0_22%,#7f5530_22%_25%)] p-2 shadow-[3px_4px_0_var(--ui-shadow)] perspective-distant">
          {POSITIONS.map((position) => {
            const face = faces[position];
            const isFound = found.includes(position);
            const isShown = isFound || faceUp.includes(position);
            const card = face === null ? undefined : cards[face];
            return (
              <button
                key={position}
                ref={(button) => {
                  buttons.current[position] = button;
                }}
                type="button"
                // Not `disabled`, which would take the focus away from the keyboard.
                aria-disabled={isFound}
                aria-label={labelOf(position)}
                onClick={() => flip(position)}
                onKeyDown={(event) => moveOnBoard(event, position)}
                className={`relative aspect-[5/7] cursor-pointer rounded-md shadow-[2px_3px_0_rgb(44_42_53/30%)] transition-transform duration-300 transform-3d outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-paper ${
                  isShown ? 'rotate-y-180' : ''
                } ${isFound ? 'cursor-default' : ''}`}
              >
                <span className="absolute inset-0 backface-hidden">
                  <CardBack />
                </span>
                {/* The fade is on the picture alone: on the button, it would flatten the 3D turn. */}
                <span
                  className={`absolute inset-0 rotate-y-180 transition-opacity duration-300 backface-hidden ${
                    isFound ? 'opacity-60' : ''
                  }`}
                >
                  {card && <CardPicture name={card.name} imageUrl={card.imageUrl} quality="low" />}
                </span>
                {/* A pair found gets a little green tick, so that it reads as done at a glance. */}
                {isFound && (
                  <span
                    aria-hidden="true"
                    className="ui-pop-in absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full border-2 border-ui-paper bg-[#3f7d48] text-sm text-ui-paper"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <form method="dialog" className="mt-3 flex">
          <button type="submit" className={CHOICE_CLASS}>
            {t('giveUp')}
          </button>
        </form>
      </TornPaper>
    </dialog>
  );
}
