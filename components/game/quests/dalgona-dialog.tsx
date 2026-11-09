'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BISCUIT_BOX,
  BISCUIT_RADIUS,
  type Carving,
  carveUntil,
  type DalgonaShape,
  FRESH_CARVING,
  GAME_SECONDS,
  outlineLength,
  outlineOf,
  type Press,
  pointAlong,
  SHAPE_COINS,
} from '@/game/quests/dalgona';
import type { DalgonaResult } from '@/player/quests/dalgona';
import { CoinIcon } from '../hud/hud-icons';
import { moveThroughChoices } from '../menu-focus';
import { CHOICE_CLASS, TornPaper } from '../shop/shop-dialog';
import type { QuestLine } from './quest-dialog';

const GAME_MS = GAME_SECONDS * 1000;
const CARVE_KEYS = new Set(['Space', 'KeyE']);
const CENTER = BISCUIT_BOX / 2;
// The cracks start showing past this pressure, and grow until the biscuit breaks.
const CRACKS_FROM = 0.45;

type Step = 'playing' | 'checking' | 'result';

// The outline as an SVG path, closed or only as far as the needle has gone.
function pathOf(points: readonly (readonly [number, number])[], isClosed: boolean): string {
  const [first, ...rest] = points;
  if (!first) {
    return '';
  }
  return `M${first[0]} ${first[1]}${rest.map(([x, y]) => `L${x} ${y}`).join('')}${isClosed ? 'Z' : ''}`;
}

// The outline's corners up to the needle, then the needle itself.
function carvedPoints(shape: DalgonaShape, distance: number): (readonly [number, number])[] {
  const outline = outlineOf(shape);
  const points: (readonly [number, number])[] = [];
  let travelled = 0;
  for (let index = 0; index < outline.length; index++) {
    const point = outline[index];
    const next = outline[(index + 1) % outline.length];
    points.push(point);
    const span = Math.hypot(next[0] - point[0], next[1] - point[1]);
    if (travelled + span >= distance) {
      break;
    }
    travelled += span;
  }
  points.push(pointAlong(shape, distance));
  return points;
}

// Hairline cracks spreading from the needle, longer as the pressure builds.
function Cracks({ at, pressure }: { at: readonly [number, number]; pressure: number }) {
  const strength = Math.max(0, (pressure - CRACKS_FROM) / (1 - CRACKS_FROM));
  if (strength === 0) {
    return null;
  }
  const length = 6 + strength * 22;
  return (
    <g stroke="#6b3a12" strokeWidth={1.2} strokeLinecap="round" opacity={0.4 + strength * 0.6}>
      {[0.4, 2.2, 3.9, 5.3].map((angle) => (
        <polyline
          key={angle}
          fill="none"
          points={`${at[0]},${at[1]} ${at[0] + Math.cos(angle) * length * 0.55},${at[1] + Math.sin(angle) * length * 0.55 + 2} ${at[0] + Math.cos(angle + 0.3) * length},${at[1] + Math.sin(angle + 0.3) * length}`}
        />
      ))}
    </g>
  );
}

// The caramel biscuit, the shape pressed into it, the line carved so far and the needle.
function Biscuit({ shape, carving }: { shape: DalgonaShape; carving: Carving }) {
  const t = useTranslations('Quest.dalgona');
  const outline = useMemo(() => pathOf(outlineOf(shape), true), [shape]);
  const isBroken = carving.status === 'broken';
  const isCarved = carving.status === 'carved';
  const needle = pointAlong(shape, carving.distance);
  return (
    <svg
      role="img"
      aria-label={t(`shapes.${shape}`)}
      viewBox={`0 0 ${BISCUIT_BOX} ${BISCUIT_BOX}`}
      className={`size-full ${isBroken ? 'ui-pull-shake-once' : ''}`}
    >
      <defs>
        <radialGradient id="dalgona-caramel" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f3c162" />
          <stop offset="75%" stopColor="#e0a03a" />
          <stop offset="100%" stopColor="#c7832a" />
        </radialGradient>
      </defs>
      {/* Its white paper edge, like every cut-out in the game. */}
      <circle cx={CENTER} cy={CENTER} r={BISCUIT_RADIUS + 9} fill="#fffdf6" />
      <circle cx={CENTER} cy={CENTER} r={BISCUIT_RADIUS} fill="url(#dalgona-caramel)" />
      {/* Bubbles in the caramel. */}
      {[
        [52, 60, 3],
        [150, 70, 2.5],
        [140, 150, 3.5],
        [60, 140, 2],
        [100, 165, 2.5],
        [40, 100, 2],
      ].map(([x, y, radius]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={radius} fill="#fbe2a8" opacity={0.6} />
      ))}
      <path
        d={outline}
        fill={isCarved ? '#f3c162' : 'none'}
        stroke="#a8661f"
        strokeWidth={2.5}
        strokeDasharray={isCarved ? undefined : '1 4'}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isCarved ? 'ui-pop-in drop-shadow-[2px_3px_0_rgb(44_42_53/30%)]' : ''}
      />
      {!isCarved && (
        <path
          d={pathOf(carvedPoints(shape, carving.distance), false)}
          fill="none"
          stroke="#5a3410"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {isBroken ? (
        // The biscuit split right across, from the needle.
        <polyline
          fill="none"
          stroke="#4a2a0c"
          strokeWidth={3}
          strokeLinejoin="round"
          points={`${needle[0]},${needle[1]} ${needle[0] + 18},${needle[1] + 24} ${needle[0] + 6},${needle[1] + 52} ${needle[0] + 30},${needle[1] + 90}`}
        />
      ) : (
        !isCarved && <Cracks at={needle} pressure={carving.pressure} />
      )}
      {!isCarved && !isBroken && (
        // The needle, its tip on the line.
        <g transform={`translate(${needle[0]} ${needle[1]}) rotate(-35)`}>
          <line x1={0} y1={0} x2={0} y2={-44} stroke="#fffdf6" strokeWidth={6} />
          <line x1={0} y1={0} x2={0} y2={-42} stroke="#9a9aa6" strokeWidth={2.5} />
          <circle cx={0} cy={-46} r={4} fill="#d0443a" stroke="#fffdf6" strokeWidth={1.5} />
        </g>
      )}
    </svg>
  );
}

type Props = {
  shape: DalgonaShape;
  onFinish: (presses: readonly Press[]) => Promise<DalgonaResult | null>;
  // Says what Gaspard answers, and the coins to show from now on.
  onEnd: (line: QuestLine, result?: DalgonaResult) => void;
};

// The carving on screen follows the same rules as the server, which replays the presses and has
// the last word.
export function DalgonaDialog({ shape, onFinish, onEnd }: Props) {
  const t = useTranslations('Quest.dalgona');
  const dialog = useRef<HTMLDialogElement>(null);
  const carveButton = useRef<HTMLButtonElement>(null);
  const resultButton = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>('playing');
  const [carving, setCarving] = useState<Carving>(FRESH_CARVING);
  const [isPressing, setIsPressing] = useState(false);
  // The game page draws again whenever the time of day or the weather changes, handing over a new
  // `onFinish` each time. Read through a ref, it never restarts the game below, whose clock would
  // otherwise start over and freeze the biscuit for as long as it had already been played.
  const latestOnFinish = useRef(onFinish);
  latestOnFinish.current = onFinish;
  const [result, setResult] = useState<DalgonaResult | null>(null);
  const game = useRef({
    startedAt: 0,
    presses: [] as Press[],
    pressStart: null as number | null,
    carving: FRESH_CARVING,
    frame: 0,
    isOver: false,
  });

  // The moment of the game, never before a step already played, so that a press can't change
  // what has been carved.
  const gameMs = useCallback(() => {
    const { startedAt, carving: played } = game.current;
    return Math.max(Math.round(performance.now() - startedAt), played.ms);
  }, []);

  const livePresses = useCallback((): Press[] => {
    const { presses, pressStart } = game.current;
    return pressStart === null ? presses : [...presses, [pressStart, Number.POSITIVE_INFINITY]];
  }, []);

  const finish = useCallback(async () => {
    const state = game.current;
    if (state.isOver) {
      return;
    }
    state.isOver = true;
    cancelAnimationFrame(state.frame);
    if (state.pressStart !== null) {
      state.presses.push([state.pressStart, Math.max(state.carving.ms, state.pressStart + 1)]);
      state.pressStart = null;
    }
    setIsPressing(false);
    setStep('checking');
    const answer = await latestOnFinish.current(state.presses);
    setResult(answer);
    setStep('result');
  }, []);

  // Opened and started once: the game's clock only ever starts here.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the shape is fixed for the whole game.
  useEffect(() => {
    dialog.current?.showModal();
    carveButton.current?.focus();
    const state = game.current;
    state.startedAt = performance.now();
    const animate = () => {
      const now = performance.now() - state.startedAt;
      state.carving = carveUntil(shape, state.carving, livePresses(), now);
      setCarving(state.carving);
      if (state.carving.status !== 'carving' || now >= GAME_MS) {
        finish();
        return;
      }
      state.frame = requestAnimationFrame(animate);
    };
    state.frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(state.frame);
  }, []);

  useEffect(() => {
    if (step === 'result') {
      resultButton.current?.focus();
    }
  }, [step]);

  const pressDown = () => {
    const state = game.current;
    if (state.isOver || state.pressStart !== null) {
      return;
    }
    state.pressStart = gameMs();
    setIsPressing(true);
  };

  const pressUp = () => {
    const state = game.current;
    if (state.isOver || state.pressStart === null) {
      return;
    }
    // Played up to now with the press still on, so that it ends exactly where the carving is.
    const end = gameMs();
    state.carving = carveUntil(shape, state.carving, livePresses(), end);
    state.presses.push([state.pressStart, Math.max(end, state.pressStart + 1)]);
    state.pressStart = null;
    setIsPressing(false);
  };

  const showGaspard = () => {
    if (!result) {
      onEnd('unavailable');
    } else {
      onEnd(result.status === 'carved' ? 'rewarded' : 'failed', result);
    }
  };

  // Space presses the focused button, such as "Give up", rather than carving. E carves from
  // anywhere, as no button answers to it.
  const isOnOtherButton = (event: KeyboardEvent) =>
    event.code === 'Space' &&
    event.target instanceof HTMLButtonElement &&
    event.target !== carveButton.current;

  const secondsLeft = Math.max(0, Math.ceil((GAME_MS - carving.ms) / 1000));
  const progress = carving.distance / outlineLength(shape);
  const resultText =
    result?.status === 'carved'
      ? t('carved')
      : carving.ms >= GAME_MS && carving.status === 'carving'
        ? t('timeUp')
        : t('broken');

  return (
    <dialog
      ref={dialog}
      aria-labelledby="dalgona-title"
      onClose={() => (step === 'result' ? showGaspard() : onEnd('failed'))}
      onKeyDown={(event) => {
        if (step === 'playing' && CARVE_KEYS.has(event.code) && !isOnOtherButton(event)) {
          // Held down, rather than clicked: the button's own click would come on letting go.
          event.preventDefault();
          if (!event.repeat) {
            pressDown();
          }
          return;
        }
        moveThroughChoices(event);
      }}
      onKeyUp={(event) => {
        if (CARVE_KEYS.has(event.code)) {
          pressUp();
          // A button presses on Space's release, which must still reach "Give up".
          if (!isOnOtherButton(event)) {
            event.preventDefault();
          }
        }
      }}
      className="ui-pop-in m-auto w-[min(28rem,calc(100%-1rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="px-4 pt-5 pb-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="dalgona-title" className="font-display text-xl">
            {t('title')}
          </h2>
          <p className="font-digits text-lg font-bold tabular-nums">
            {t('timeLeft', { seconds: secondsLeft })}
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-lg">
          <CoinIcon />
          {t('shape', { shape: t(`shapes.${shape}`), count: SHAPE_COINS[shape] })}
        </p>
        <div className="mx-auto mt-2 aspect-square w-[min(100%,18rem)]">
          <Biscuit shape={shape} carving={carving} />
        </div>
        {step === 'playing' && (
          // A meter of how hard the needle presses, from calm to breaking.
          // biome-ignore lint/a11y/useSemanticElements: a <meter> can't be drawn as paper.
          <div
            role="meter"
            aria-label={t('pressure')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(carving.pressure * 100)}
            className="mt-2 h-3 overflow-hidden rounded-full bg-[#ece2cc] shadow-[inset_1px_2px_0_rgb(44_42_53/14%)]"
          >
            <span
              className="block h-full rounded-full transition-[background-color] duration-200"
              style={{
                width: `${carving.pressure * 100}%`,
                backgroundColor:
                  carving.pressure > 0.75
                    ? '#d0443a'
                    : carving.pressure > CRACKS_FROM
                      ? '#e9a23b'
                      : '#3f8a6a',
              }}
            />
          </div>
        )}
        <p aria-live="polite" className="mt-2 min-h-7 text-center text-lg">
          {step === 'checking' && t('checking')}
          {step === 'result' && (
            <>
              {resultText}
              {result && result.coins > 0 && ` ${t('coins', { count: result.coins })}`}
            </>
          )}
        </p>
        <form method="dialog" className="mt-2 flex flex-wrap gap-2.5">
          {step === 'result' ? (
            <button
              ref={resultButton}
              type="submit"
              className={`${CHOICE_CLASS} bg-ui-stamp! text-ui-paper`}
            >
              {t('showGaspard')}
            </button>
          ) : (
            <>
              <button
                ref={carveButton}
                type="button"
                // Not `disabled`, which would take the focus away from the keyboard.
                aria-disabled={step !== 'playing'}
                aria-pressed={isPressing}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  pressDown();
                }}
                onPointerUp={pressUp}
                onPointerCancel={pressUp}
                onLostPointerCapture={pressUp}
                // Touch screens would otherwise scroll or open a menu on a long press.
                onContextMenu={(event) => event.preventDefault()}
                className={`${CHOICE_CLASS} touch-none select-none whitespace-nowrap bg-ui-stamp! text-ui-paper ${isPressing ? 'translate-y-0.5 shadow-none' : ''}`}
              >
                {isPressing ? t('carving') : t('carve')}
                {progress > 0 && ` · ${Math.floor(progress * 100)} %`}
              </button>
              {step === 'playing' && (
                <button type="submit" className={CHOICE_CLASS}>
                  {t('giveUp')}
                </button>
              )}
            </>
          )}
        </form>
        <p className="mt-2 text-sm text-ui-ink/70 pointer-coarse:hidden">{t('keyHint')}</p>
      </TornPaper>
    </dialog>
  );
}
