'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { PlayableSet } from '@/game/cards/card-sets';
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
} from '@/game/quests/basketball';
import type { BasketballResult } from '@/player/quests/basketball';
import { BoosterIcon, CoinIcon } from '../hud/hud-icons';
import { moveThroughChoices } from '../menu-focus';
import { CHOICE_CLASS, TornPaper } from '../shop/shop-dialog';

const GAME_MS = GAME_SECONDS * 1000;
const FLIGHT_MS = 450;
const LED_CLASS =
  'rounded-sm bg-[#14122a] px-2 py-0.5 text-center font-digits text-lg font-bold tabular-nums text-[#ffc83d] [text-shadow:0_0_6px_rgb(255_200_61/70%)]';

// A basketball, drawn like the ones on the machine: orange, with its seams, cut out of paper.
function Ball() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className="size-full">
      <circle cx="20" cy="20" r="19" fill="#fffdf6" />
      <circle cx="20" cy="20" r="16" fill="#e8792b" />
      <path
        d="M4 20h32M20 4v32M8.5 9.5c5 4 5 17 0 21M31.5 9.5c-5 4-5 17 0 21"
        fill="none"
        stroke="#8a3f12"
        strokeWidth="1.8"
      />
      <ellipse cx="14" cy="13" rx="4" ry="2.5" fill="#fff" fillOpacity="0.35" />
    </svg>
  );
}

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
  const net = useRef<HTMLSpanElement>(null);
  const board = useRef<HTMLSpanElement>(null);
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
            { transform: 'translate(0, 0) scale(1)' },
            { transform: 'translate(0, -11rem) scale(0.6)', offset: 0.7 },
            { transform: 'translate(0, -8rem) scale(0.55)' },
          ]
        : [
            { transform: 'translate(0, 0) scale(1)' },
            { transform: 'translate(90%, -9.5rem) scale(0.6)', offset: 0.65 },
            { transform: 'translate(230%, -3rem) scale(0.6)' },
          ],
      { duration: FLIGHT_MS, easing: 'ease-out' },
    );
    // The net swings when the ball goes through, and the board lights up for a swish.
    if (points > 0) {
      net.current?.animate(
        // Only `transform`: the net is centred with `translate`, which this leaves alone.
        [
          { transform: 'scaleY(1)' },
          { transform: 'scaleY(1.35) skewX(6deg)' },
          { transform: 'scaleY(1)' },
        ],
        { duration: 380, delay: FLIGHT_MS * 0.7, easing: 'ease-out' },
      );
    }
    if (points === 3) {
      board.current?.animate(
        [
          { boxShadow: '0 0 0 0 rgb(255 216 79 / 0%)' },
          { boxShadow: '0 0 1.5rem 0.5rem rgb(255 216 79 / 90%)' },
          { boxShadow: '0 0 0 0 rgb(255 216 79 / 0%)' },
        ],
        { duration: 600, delay: FLIGHT_MS * 0.6 },
      );
    }
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
      className="ui-pop-in m-auto max-h-dvh w-[min(30rem,calc(100%-1rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="px-4 pt-5 pb-5 sm:px-5">
        {/* The machine's red top, with its lit score panels. */}
        <div className="-mx-1 rounded-md bg-[#c8453a] px-3 pt-2 pb-2.5 text-ui-paper shadow-[3px_4px_0_var(--ui-shadow)]">
          <h2 id="basketball-title" className="text-center font-display text-xl">
            {t('title')}
          </h2>
          <dl className="mt-1.5 grid grid-cols-3 gap-2 text-center text-sm">
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
        </div>

        {isRewardTaken && result?.reward !== 'coins' && result?.reward !== 'booster' && (
          <p className="mx-auto mt-3 w-fit -rotate-1 ui-scrap bg-ui-accent px-3 py-1 text-center">
            {t('alreadyPaid')}
          </p>
        )}
        {step === 'result' && result ? (
          <div className="py-5 text-center">
            <p className="font-display text-3xl">{t('result', { score: result.score })}</p>
            {result.isNewHighScore && (
              <p className="ui-bob mx-auto mt-2 w-fit rotate-2 ui-scrap bg-ui-stamp px-3 py-0.5 font-display text-ui-paper">
                {t('newHighScore')}
              </p>
            )}
            {(result.reward !== 'none' || !isRewardTaken) && (
              <p className="mt-3 flex items-center justify-center gap-2 text-xl">
                {result.reward === 'booster' ? (
                  <BoosterIcon />
                ) : result.reward === 'coins' ? (
                  <CoinIcon />
                ) : null}
                {result.reward === 'booster' && setName
                  ? t('booster', { set: setName })
                  : result.reward === 'none'
                    ? t('noReward')
                    : t('coins', { coins: BASKETBALL_COINS })}
              </p>
            )}
          </div>
        ) : step === 'ready' || step === 'error' ? (
          <div className="py-4">
            <p className="text-lg leading-snug">
              {step === 'error' ? t('error') : t('rules', { seconds: GAME_SECONDS })}
            </p>
            <ul className="mt-3 grid gap-2">
              <li className="flex -rotate-[0.6deg] items-center gap-2 rounded-xs bg-[#efe6d2] px-3 py-1.5 shadow-[2px_3px_0_var(--ui-shadow)]">
                <CoinIcon />
                {t('rewardCoins', { score: COINS_SCORE, coins: BASKETBALL_COINS })}
              </li>
              <li className="flex rotate-[0.6deg] items-center gap-2 rounded-xs bg-[#efe6d2] px-3 py-1.5 shadow-[2px_3px_0_var(--ui-shadow)]">
                <BoosterIcon />
                {t('rewardBooster', { score: BOOSTER_SCORE })}
              </li>
            </ul>
            {!isRewardTaken && <p className="mt-3 text-ui-ink/65">{t('oncePerDay')}</p>}
          </div>
        ) : (
          <>
            {/* The machine's inside: a backboard, a hoop with its net, under neon light. */}
            <div className="relative mt-3 h-60 overflow-hidden rounded-md border-x-8 border-[#3a6fb0] bg-[#2e2a4a] shadow-[3px_4px_0_var(--ui-shadow)]">
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-1 h-1 bg-[#ff4fa3] shadow-[0_0_8px_#ff4fa3]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/10%)_1.5px,transparent_1.5px)] bg-size-[14px_14px]"
              />
              <span
                ref={board}
                aria-hidden="true"
                className="absolute top-4 left-1/2 h-16 w-28 -translate-x-1/2 rounded-md bg-ui-paper"
              >
                <span className="absolute inset-x-8 top-5 bottom-1 border-4 border-ui-stamp" />
              </span>
              <span
                ref={net}
                aria-hidden="true"
                className="absolute top-[5.4rem] left-1/2 h-7 w-12 origin-top -translate-x-1/2 [clip-path:polygon(0_0,100%_0,80%_100%,20%_100%)] bg-[repeating-linear-gradient(60deg,transparent_0_5px,rgb(255_255_255/80%)_5px_7px),repeating-linear-gradient(-60deg,transparent_0_5px,rgb(255_255_255/80%)_5px_7px)]"
              />
              <span
                aria-hidden="true"
                className="absolute top-20 left-1/2 h-2.5 w-16 -translate-x-1/2 rounded-full border-4 border-[#e8792b]"
              />
              <span
                ref={ball}
                aria-hidden="true"
                className="absolute bottom-3 left-1/2 size-11 -translate-x-1/2"
              >
                <Ball />
              </span>
              {shotLabel && (
                <p
                  key={lastShot?.number}
                  aria-live="polite"
                  className={`ui-pop-in absolute inset-x-0 top-32 mx-auto w-fit -rotate-3 ui-scrap px-3 font-display text-lg ${
                    lastShot?.points === 3
                      ? 'bg-ui-accent'
                      : lastShot?.points === 2
                        ? 'bg-ui-paper'
                        : 'bg-[#e6ece8] text-ui-ink/70'
                  }`}
                >
                  {shotLabel}
                </p>
              )}
            </div>
            {/* The timing gauge: shoot when the cursor is in the green. */}
            <div
              aria-hidden="true"
              className="relative mt-3 h-7 overflow-hidden rounded-md bg-[#e4572e] shadow-[2px_3px_0_var(--ui-shadow)]"
            >
              <span
                className="absolute inset-y-0 bg-[#ffc83d]"
                style={{ left: `${(0.5 - BASKET_ZONE) * 100}%`, width: `${BASKET_ZONE * 200}%` }}
              />
              <span
                className="absolute inset-y-0 bg-[#3bb273]"
                style={{ left: `${(0.5 - SWISH_ZONE) * 100}%`, width: `${SWISH_ZONE * 200}%` }}
              />
              <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_9px,rgb(255_255_255/18%)_9px_10px)]" />
              <span
                ref={cursor}
                className="absolute inset-y-0 w-2 -translate-x-1/2 rounded-full bg-ui-paper shadow-[0_0_0_2px_var(--ui-ink)]"
                style={{ left: 0 }}
              />
            </div>
          </>
        )}

        <form method="dialog" className="mt-4 flex flex-wrap gap-2.5">
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
            className={`${CHOICE_CLASS} touch-manipulation bg-ui-stamp text-ui-paper select-none`}
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
      </TornPaper>
    </dialog>
  );
}
