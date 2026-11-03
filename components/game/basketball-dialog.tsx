'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import {
  BASKET_ZONE,
  BASKETBALL_COINS,
  BOOSTER_SCORE,
  COINS_SCORE,
  cursorPosition,
  GAME_SECONDS,
  pointsOfShot,
  readyAt,
  SWISH_ZONE,
} from '@/game/basketball';
import type { PlayableSet } from '@/game/card-sets';
import type { BasketballResult } from '@/player/progress';
import { moveThroughChoices } from './menu-focus';
import { CHOICE_CLASS } from './shop-dialog';

const GAME_MS = GAME_SECONDS * 1000;
const FLIGHT_MS = 450;
const LED_CLASS =
  'rounded-md bg-black px-2 py-0.5 text-center font-semibold tabular-nums text-[#ffc83d]';

type Step = 'ready' | 'starting' | 'playing' | 'finishing' | 'result' | 'error';

type Props = {
  sets: readonly PlayableSet[];
  highScore: number;
  // Today's reward has been paid, so that a game now only counts for the high score.
  isRewardTaken: boolean;
  onFinish: (shots: readonly number[]) => Promise<BasketballResult | null>;
  onClose: () => void;
};

// The score on screen follows the same rules as the server, whose answer is the one that counts.
export function BasketballDialog({ sets, highScore, isRewardTaken, onFinish, onClose }: Props) {
  const t = useTranslations('Basketball');
  const dialog = useRef<HTMLDialogElement>(null);
  const mainButton = useRef<HTMLButtonElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const ball = useRef<HTMLSpanElement>(null);
  const game = useRef({ startedAt: 0, shots: [] as number[], timer: 0, frame: 0 });
  const [step, setStep] = useState<Step>('ready');
  const [score, setScore] = useState(0);
  const [lastShot, setLastShot] = useState<{ points: number; number: number } | null>(null);
  const [result, setResult] = useState<BasketballResult | null>(null);
  const setName = sets.find(({ id }) => id === result?.boosterSetId)?.name;

  useEffect(() => {
    dialog.current?.showModal();
    mainButton.current?.focus();
    const { current } = game;
    return () => {
      clearTimeout(current.timer);
      cancelAnimationFrame(current.frame);
    };
  }, []);

  const finish = async () => {
    cancelAnimationFrame(game.current.frame);
    if (clock.current) {
      clock.current.textContent = '0';
    }
    setStep('finishing');
    const answer = await onFinish(game.current.shots);
    setResult(answer);
    setStep(answer ? 'result' : 'error');
    mainButton.current?.focus();
  };

  const animate = () => {
    const { startedAt, shots } = game.current;
    const now = performance.now() - startedAt;
    const ready = readyAt(shots.at(-1));
    if (cursor.current) {
      cursor.current.style.left = `${cursorPosition(now - ready, shots.length) * 100}%`;
    }
    if (clock.current) {
      clock.current.textContent = String(Math.max(Math.ceil((GAME_MS - now) / 1000), 0));
    }
    game.current.frame = requestAnimationFrame(animate);
  };

  const start = async () => {
    setStep('starting');
    try {
      const response = await fetch('/api/quests/basketball/start', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch {
      setStep('error');
      return;
    }
    game.current = { ...game.current, startedAt: performance.now(), shots: [] };
    game.current.timer = window.setTimeout(finish, GAME_MS);
    setScore(0);
    setLastShot(null);
    setResult(null);
    setStep('playing');
    animate();
    mainButton.current?.focus();
  };

  const shoot = () => {
    const { startedAt, shots } = game.current;
    const now = Math.round(performance.now() - startedAt);
    const previous = shots.at(-1);
    // The ball is still on its way back, or the time is up.
    if (now < readyAt(previous) || now > GAME_MS) {
      return;
    }
    const points = pointsOfShot(now, previous, shots.length);
    shots.push(now);
    setScore((current) => current + points);
    setLastShot({ points, number: shots.length });
    ball.current?.animate(
      points > 0
        ? [
            { transform: 'translate(-50%, 0) scale(1)' },
            { transform: 'translate(-50%, -11rem) scale(0.6)', offset: 0.7 },
            { transform: 'translate(-50%, -8rem) scale(0.55)' },
          ]
        : [
            { transform: 'translate(-50%, 0) scale(1)' },
            { transform: 'translate(40%, -9.5rem) scale(0.6)', offset: 0.65 },
            { transform: 'translate(180%, -3rem) scale(0.6)' },
          ],
      { duration: FLIGHT_MS, easing: 'ease-out' },
    );
  };

  // On the key's way down, as waiting for the browser's click on its way up would spoil the timing.
  const onMainKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (step === 'playing' && (event.code === 'Space' || event.code === 'Enter')) {
      event.preventDefault();
      if (!event.repeat) {
        shoot();
      }
    }
  };

  const isBusy = step === 'starting' || step === 'finishing';
  const isPlaying = step === 'playing';
  const shownHighScore = result?.highScore ?? highScore;
  const shotLabel =
    lastShot &&
    (lastShot.points === 3 ? t('swish') : lastShot.points === 2 ? t('basket') : t('miss'));

  return (
    <dialog
      ref={dialog}
      aria-labelledby="basketball-title"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto max-h-dvh w-[calc(100%-2rem)] max-w-md overflow-auto ui-scrap p-3 font-game text-ui-ink backdrop:bg-black/50"
    >
      <h2 id="basketball-title" className="font-display text-lg">
        {t('title')}
      </h2>
      <dl className="mt-1 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
        <div>
          <dt>{t('score')}</dt>
          <dd className={LED_CLASS}>{isPlaying || !result ? score : result.score}</dd>
        </div>
        <div>
          <dt>{t('time')}</dt>
          <dd className={LED_CLASS}>
            <span ref={clock}>{GAME_SECONDS}</span>
          </dd>
        </div>
        <div>
          <dt>{t('highScore')}</dt>
          <dd className={LED_CLASS}>{shownHighScore}</dd>
        </div>
      </dl>

      {isRewardTaken && result?.reward !== 'coins' && result?.reward !== 'booster' && (
        <p className="mt-2 ui-scrap bg-ui-accent px-2 py-1 text-center text-sm font-semibold">
          {t('alreadyPaid')}
        </p>
      )}
      {step === 'result' && result ? (
        <div className="py-6 text-center">
          <p className="text-2xl font-semibold">{t('result', { score: result.score })}</p>
          {result.isNewHighScore && (
            <p className="ui-bob font-semibold text-[#b5179e]">{t('newHighScore')}</p>
          )}
          <p className="mt-2 text-lg font-medium">
            {result.reward === 'booster' && setName
              ? t('booster', { set: setName })
              : result.reward === 'none'
                ? isRewardTaken
                  ? null
                  : t('noReward')
                : t('coins', { coins: BASKETBALL_COINS })}
          </p>
        </div>
      ) : step === 'ready' || step === 'error' ? (
        <div className="py-3 text-sm font-medium">
          <p className="text-base">
            {step === 'error' ? t('error') : t('rules', { seconds: GAME_SECONDS })}
          </p>
          <ul className="mt-2 list-inside list-disc">
            <li>{t('rewardCoins', { score: COINS_SCORE, coins: BASKETBALL_COINS })}</li>
            <li>{t('rewardBooster', { score: BOOSTER_SCORE })}</li>
          </ul>
          {!isRewardTaken && <p className="mt-2 opacity-70">{t('oncePerDay')}</p>}
        </div>
      ) : (
        <>
          <div className="relative mt-2 h-56 overflow-hidden rounded-lg bg-[#2a2550]">
            <span
              aria-hidden="true"
              className="absolute top-2 left-1/2 h-14 w-24 -translate-x-1/2 rounded-sm border-4 border-white bg-white/10"
            />
            <span
              aria-hidden="true"
              className="absolute top-14 left-1/2 h-2 w-14 -translate-x-1/2 rounded-full border-3 border-[#ff6b35]"
            />
            <span
              aria-hidden="true"
              className="absolute top-16 left-1/2 h-6 w-12 -translate-x-1/2 border-x-2 border-b-2 border-dashed border-white/70"
            />
            <span
              ref={ball}
              aria-hidden="true"
              className="absolute bottom-2 left-1/2 size-10 -translate-x-1/2 rounded-full border-3 border-ui-ink bg-[#f28c28]"
            />
            <p
              key={lastShot?.number}
              aria-live="polite"
              className="ui-pop-in absolute inset-x-0 top-28 text-center text-lg font-semibold text-white"
            >
              {shotLabel}
            </p>
          </div>
          <div
            aria-hidden="true"
            className="relative mt-3 h-6 overflow-hidden rounded-full border-3 border-ui-ink bg-[#e4572e]"
          >
            <span
              className="absolute inset-y-0 bg-[#ffc83d]"
              style={{ left: `${(0.5 - BASKET_ZONE) * 100}%`, width: `${BASKET_ZONE * 200}%` }}
            />
            <span
              className="absolute inset-y-0 bg-[#3bb273]"
              style={{ left: `${(0.5 - SWISH_ZONE) * 100}%`, width: `${SWISH_ZONE * 200}%` }}
            />
            <span
              ref={cursor}
              className="absolute inset-y-0 w-1.5 -translate-x-1/2 bg-ui-ink"
              style={{ left: 0 }}
            />
          </div>
        </>
      )}

      <form method="dialog" className="mt-2">
        <button
          ref={mainButton}
          type="button"
          // Not `disabled`, which would take the focus away from the keyboard.
          aria-disabled={isBusy}
          onKeyDown={onMainKeyDown}
          onPointerDown={() => {
            if (isPlaying) {
              shoot();
            }
          }}
          onClick={() => {
            if (step === 'ready' || step === 'result' || step === 'error') {
              start();
            }
          }}
          className={`${CHOICE_CLASS} touch-manipulation select-none`}
        >
          {isPlaying || step === 'finishing'
            ? t('shoot')
            : step === 'ready'
              ? t('play')
              : t('playAgain')}
        </button>
        <button type="submit" className={CHOICE_CLASS}>
          {t('leave')}
        </button>
      </form>
    </dialog>
  );
}
