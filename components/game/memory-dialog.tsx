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
import { CHOICE_CLASS } from './shop-dialog';

const COLUMNS = 4;
// Long enough to remember two different cards before they turn back.
const SHOWN_MILLISECONDS = 1100;

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

  return (
    <dialog
      ref={dialog}
      aria-labelledby="memory-title"
      onClose={onGiveUp}
      className="ui-pop-in m-auto max-h-dvh w-[min(100%,calc(54dvh+2rem))] overflow-auto ui-scrap p-3 font-game text-ui-ink backdrop:bg-black/50"
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id="memory-title" className="font-display text-lg">
          {t('title')}
        </h2>
        <p aria-live="polite" className="text-sm font-semibold tabular-nums">
          {t('moves', { moves, limit: MEMORY_MOVE_LIMIT })}
          {' · '}
          {t('pairs', { found: found.length / 2, total: MEMORY_PAIRS })}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-1.5 perspective-distant">
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
              className={`relative aspect-[5/7] cursor-pointer rounded-md transition-transform duration-300 transform-3d focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-ui-accent ${
                isShown ? 'rotate-y-180' : ''
              } ${isFound ? 'cursor-default' : ''}`}
            >
              <span className="absolute inset-0 backface-hidden">
                <CardBack />
              </span>
              {/* The fade is on the picture alone: on the button, it would flatten the 3D turn. */}
              <span
                className={`absolute inset-0 rotate-y-180 transition-opacity duration-300 backface-hidden ${
                  isFound ? 'opacity-50' : ''
                }`}
              >
                {card && <CardPicture name={card.name} imageUrl={card.imageUrl} quality="low" />}
              </span>
            </button>
          );
        })}
      </div>
      <form method="dialog" className="mt-2">
        <button type="submit" className={CHOICE_CLASS}>
          {t('giveUp')}
        </button>
      </form>
    </dialog>
  );
}
