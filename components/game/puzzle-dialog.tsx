'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  type Board,
  canSlide,
  cellForArrow,
  GAP,
  isSolved,
  PUZZLE_QUICK_MOVES,
  PUZZLE_QUICK_REWARD,
  PUZZLE_REWARD,
  PUZZLE_SIZE,
  slide,
} from '@/game/painter-puzzle';
import type { Wallet } from '@/game/shop-dialogue';
import type { PuzzleResult } from '@/player/progress';
import { openDialog } from './menu-focus';
import { drawPainting } from './paper-art';
import { usePlayerName } from './player-name';
import { SellerPortrait } from './seller-portrait';
import { CHOICE_CLASS, TornPaper } from './shop-dialog';

type Step =
  | { kind: 'starting' }
  | { kind: 'playing'; board: Board; moves: number[] }
  | { kind: 'checking'; moves: number[] }
  | { kind: 'done'; result: PuzzleResult }
  | { kind: 'alreadyDone' }
  | { kind: 'error' };

const ARROWS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
} as const;

type Props = {
  // The coins after the puzzle, for the counters and the save notice.
  onFinished: (wallet: Wallet) => void;
  onClose: () => void;
};

// The painting, drawn once, as a picture the pieces each show a part of.
let paintingUrl: string | null = null;
function usePaintingUrl() {
  return useMemo(() => {
    paintingUrl ??= drawPainting().toDataURL();
    return paintingUrl;
  }, []);
}

// Pinceau's sliding puzzle: his painting cut into a 3×3 grid, a piece missing, mixed up. A click
// or a touch on a piece next to the gap slides it in, and so do the arrow keys, each pushing the
// piece on the far side of the gap the way it points. Once whole, the server plays the moves again
// and pays, once a day.
export function PuzzleDialog({ onFinished, onClose }: Props) {
  const t = useTranslations('Puzzle');
  const playerName = usePlayerName();
  const dialog = useRef<HTMLDialogElement>(null);
  const board = useRef<HTMLFieldSetElement>(null);
  const painting = usePaintingUrl();
  const [step, setStep] = useState<Step>({ kind: 'starting' });

  useEffect(() => {
    openDialog(dialog.current);
    fetch('/api/quests/puzzle/start', { method: 'POST' })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((answer: { hasStarted: boolean; board?: Board }) =>
        setStep(
          answer.hasStarted && answer.board
            ? { kind: 'playing', board: answer.board, moves: [] }
            : { kind: 'alreadyDone' },
        ),
      )
      .catch(() => setStep({ kind: 'error' }));
  }, []);

  // The board takes the focus once drawn, so that the arrow keys slide the pieces at once; every
  // other step puts it on its button.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (step.kind === 'playing') {
        board.current?.focus();
      } else if (step.kind !== 'starting' && step.kind !== 'checking') {
        dialog.current?.querySelector<HTMLElement>('[data-first-focus]')?.focus();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [step.kind]);

  const move = (cell: number) => {
    if (step.kind !== 'playing' || !canSlide(step.board, cell)) {
      return;
    }
    const next = slide(step.board, cell);
    const moves = [...step.moves, cell];
    if (!isSolved(next)) {
      setStep({ kind: 'playing', board: next, moves });
      return;
    }
    setStep({ kind: 'checking', moves });
    fetch('/api/quests/puzzle/finish', { method: 'POST', body: JSON.stringify({ moves }) })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((result: PuzzleResult) => {
        onFinished(result.wallet);
        setStep({ kind: 'done', result });
      })
      .catch(() => setStep({ kind: 'error' }));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const direction = ARROWS[event.key as keyof typeof ARROWS];
    if (step.kind !== 'playing' || !direction) {
      return;
    }
    event.preventDefault();
    const cell = cellForArrow(step.board, direction);
    if (cell !== null && !event.repeat) {
      move(cell);
    }
  };

  const isWhole = step.kind === 'checking' || step.kind === 'done';

  return (
    <dialog
      ref={dialog}
      aria-labelledby="puzzle-title"
      onClose={onClose}
      onKeyDown={onKeyDown}
      className="ui-pop-in m-auto w-[min(30rem,calc(100%-1rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="px-3 pt-4 pb-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="block size-14 shrink-0 overflow-hidden rounded-full border-2 border-[#fbf6ea] bg-[#e7d9bc] shadow-[1px_2px_0_var(--ui-shadow)]">
            <SellerPortrait stock="painter" />
          </span>
          <div>
            <h2 id="puzzle-title" className="font-display text-xl">
              {t('title')}
            </h2>
            {step.kind === 'playing' && (
              <p className="text-ui-ink/70">{t('moves', { count: step.moves.length })}</p>
            )}
          </div>
        </div>

        {(step.kind === 'starting' || step.kind === 'playing') && (
          <p className="mt-2 text-ui-ink/80">
            {t('howTo', {
              coins: PUZZLE_REWARD,
              quickCoins: PUZZLE_QUICK_REWARD,
              moves: PUZZLE_QUICK_MOVES,
            })}
          </p>
        )}

        {(step.kind === 'playing' || isWhole) && (
          // The easel's frame, and the pieces in it.
          <div className="mx-auto mt-3 w-full max-w-80 rounded-sm bg-[#b8873e] p-2 shadow-[2px_3px_0_var(--ui-shadow)]">
            {isWhole ? (
              <div
                role="img"
                aria-label={t('whole')}
                className="ui-pop-in aspect-square w-full rounded-[2px] bg-cover"
                style={{ backgroundImage: `url(${painting})` }}
              />
            ) : (
              <fieldset
                ref={board}
                tabIndex={-1}
                aria-label={t('board')}
                className="m-0 grid aspect-square w-full min-w-0 grid-cols-3 gap-1 rounded-[2px] border-0 bg-[#6b4a2e] p-1 outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp"
              >
                {step.kind === 'playing' &&
                  step.board.map((piece, cell) =>
                    piece === GAP ? (
                      <span key="gap" className="rounded-[2px] bg-[#4a2f1c]/60" />
                    ) : (
                      <button
                        // The key follows the piece, so that it slides rather than redraws.
                        key={piece}
                        type="button"
                        aria-label={t('piece', { number: piece + 1 })}
                        aria-disabled={!canSlide(step.board, cell)}
                        onClick={() => move(cell)}
                        className={`relative rounded-[2px] bg-no-repeat shadow-[1px_2px_0_rgb(0_0_0/30%)] outline-none transition-transform focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-dashed focus-visible:outline-ui-stamp ${
                          canSlide(step.board, cell)
                            ? 'cursor-pointer hover:brightness-110 active:translate-y-0.5'
                            : 'cursor-default'
                        }`}
                        style={{
                          backgroundImage: `url(${painting})`,
                          backgroundSize: `${PUZZLE_SIZE * 100}% ${PUZZLE_SIZE * 100}%`,
                          backgroundPosition: `${((piece % PUZZLE_SIZE) / (PUZZLE_SIZE - 1)) * 100}% ${
                            (Math.floor(piece / PUZZLE_SIZE) / (PUZZLE_SIZE - 1)) * 100
                          }%`,
                        }}
                      />
                    ),
                  )}
              </fieldset>
            )}
          </div>
        )}

        {step.kind === 'checking' && <p className="mt-3 text-center text-lg">…</p>}
        {step.kind === 'done' && (
          <p className="mt-3 text-lg">
            {t('thanks', {
              name: playerName,
              moves: step.result.checked,
              coins: step.result.coins,
            })}
          </p>
        )}
        {step.kind === 'alreadyDone' && (
          <p className="mt-3 text-lg">{t('alreadyDone', { name: playerName })}</p>
        )}
        {step.kind === 'error' && <p className="mt-3 text-lg">{t('error')}</p>}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            data-first-focus
            onClick={() => dialog.current?.close()}
            className={`${CHOICE_CLASS} ${step.kind === 'done' ? 'bg-ui-accent!' : ''}`}
          >
            {step.kind === 'playing' || step.kind === 'starting' ? t('stop') : t('close')}
          </button>
        </div>
      </TornPaper>
    </dialog>
  );
}
