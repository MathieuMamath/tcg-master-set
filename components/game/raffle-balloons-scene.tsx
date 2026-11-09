'use client';

import { useTranslations } from 'next-intl';
import { type PointerEvent, useCallback, useMemo, useRef } from 'react';
import {
  BALLOON_LANES,
  BALLOONS_MISTAKE_LIMIT,
  type Balloon,
  type BalloonColor,
  type BalloonsState,
  balloonCalls,
  balloonsPoints,
  calledAt,
  canPop,
  highestIn,
  riseOf,
  simulateBalloons,
  standBalloons,
  touchOf,
} from '@/game/raffle-balloons';
import { drawFairScenery, FAIR_SCENERY_SIZE } from './paper-art';
import {
  CanvasArt,
  digitKeys,
  HostSays,
  pressHandlers,
  ScoreLine,
  type ShiftEnd,
  ShiftFrame,
  useShift,
} from './shift';

const MOMENT_MS = 800;
const REMARK_MS = 1500;
// How far around a balloon a click or a finger still pops it, in pixels.
const TOUCH_SLACK = 14;
const BALLOON_HUES: Record<BalloonColor, { fill: string; shine: string }> = {
  red: { fill: '#d6453a', shine: '#f08a7e' },
  blue: { fill: '#3c78b4', shine: '#7fb3d9' },
  yellow: { fill: '#f0c43a', shine: '#fbe28a' },
  green: { fill: '#4f8a3c', shine: '#8cc06a' },
};

// The fair's scenery, drawn once when first needed, then copied onto the canvas that shows it.
let fairScenery: HTMLCanvasElement | null = null;
function drawFair(drawing: CanvasRenderingContext2D, width: number, height: number) {
  fairScenery ??= drawFairScenery();
  drawing.drawImage(fairScenery, 0, 0, width, height);
}

// Pop'Balloons at Bérénice's stand: the balloons rising in four lanes, the colour she calls on its
// sign, and a button per lane. The keys 1 to 4 or the buttons pop the highest balloon of a lane,
// the next to float away, and a click or a touch pops the balloon it lands on.
export function BalloonsShift({ onDone }: { onDone: (end: ShiftEnd) => void }) {
  const t = useTranslations('Balloons.balloons');
  const box = useRef<HTMLDivElement>(null);
  const simulate = useCallback(simulateBalloons, []);
  const { phase, state, start, press, showScore, secondsLeft } = useShift(
    'balloons',
    simulate,
    balloonsPoints,
  );
  const isPlaying = phase.step === 'playing';
  const seed = phase.step === 'playing' ? phase.seed : 0;
  const calls = useMemo(() => balloonCalls(seed), [seed]);
  const balloons = useMemo(() => standBalloons(seed, calls), [seed, calls]);
  const pop = (choice: number) => press(choice, (now) => canPop(now, balloons, choice));

  return (
    <ShiftFrame
      host="berenice"
      job="balloons"
      phase={phase}
      onShowScore={showScore}
      secondsLeft={secondsLeft}
      howTo={t('howTo')}
      onStart={start}
      onDone={onDone}
      onKeyDown={digitKeys(isPlaying, BALLOON_LANES, pop)}
      box={box}
    >
      {state && (
        <>
          <ScoreLine
            points={balloonsPoints(state)}
            mistakes={state.mistakes}
            limit={BALLOONS_MISTAKE_LIMIT}
          />
          <Sky
            state={state}
            balloons={balloons}
            called={calledAt(calls, state.now)}
            onTouch={(balloon) => pop(touchOf(balloon))}
          />
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {Array.from({ length: BALLOON_LANES }, (_, lane) => lane).map((lane) => (
              <button
                key={lane}
                type="button"
                {...pressHandlers(() => pop(lane))}
                className="flex min-h-11 cursor-pointer touch-manipulation items-center justify-center gap-1 rounded-sm bg-[#6b4a2e] px-1 text-[#fbf6ea] shadow-[2px_3px_0_var(--ui-shadow)] outline-none select-none active:translate-y-0.5 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp"
              >
                <kbd className="font-digits text-xs opacity-70 pointer-coarse:hidden">
                  {lane + 1}
                </kbd>
                <span aria-hidden="true">🎯</span>
                <span className="sr-only">{t('lane', { number: lane + 1 })}</span>
              </button>
            ))}
          </div>
          <HostSays
            host="berenice"
            text={remarkOf(state, t, t(`colors.${calledAt(calls, state.now)}`))}
          />
        </>
      )}
    </ShiftFrame>
  );
}

// The sky over the stand: the colour called on its sign, the lanes, the balloons rising, and the
// bursts of those just popped. A click or a touch pops the balloon it lands on, or the nearest
// within a finger's slack, and nothing on an empty patch of sky.
function Sky({
  state,
  balloons,
  called,
  onTouch,
}: {
  state: BalloonsState;
  balloons: readonly Balloon[];
  called: BalloonColor;
  onTouch: (balloon: number) => void;
}) {
  const t = useTranslations('Balloons.balloons');
  const laneWidth = 100 / BALLOON_LANES;
  const flying = balloons
    .map((balloon, index) => ({ balloon, index, share: riseOf(balloon, state.now) }))
    .filter(({ index, share }) => share !== null && !state.popped.has(index));
  const highest = new Set(
    Array.from({ length: BALLOON_LANES }, (_, lane) => highestIn(state, balloons, lane)),
  );
  const bursts = state.moments.filter(
    (moment) => moment.kind !== 'streak' && state.now - moment.at < MOMENT_MS,
  );
  const placeOf = (balloon: Balloon, index: number, share: number) => ({
    left: laneWidth * (balloon.lane + 0.5) + Math.sin(share * 6 + index) * laneWidth * 0.12,
    bottom: 6 + share * 92,
  });

  return (
    <div
      role="img"
      aria-label={t('board', { color: t(`colors.${called}`) })}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        const touched = touchedBalloon(event.currentTarget, event.clientX, event.clientY);
        if (touched !== null) {
          onTouch(touched);
        }
      }}
      className="relative mt-2 h-72 cursor-crosshair touch-manipulation overflow-hidden rounded-sm bg-[#bfe0f0] select-none sm:h-80"
    >
      <CanvasArt
        draw={drawFair}
        width={FAIR_SCENERY_SIZE.width}
        height={FAIR_SCENERY_SIZE.height}
        className="absolute inset-0 size-full object-cover object-bottom"
      />
      {Array.from({ length: BALLOON_LANES - 1 }, (_, line) => line + 1).map((line) => (
        <span
          key={line}
          className="absolute inset-y-0 border-l-2 border-dashed border-white/40"
          style={{ left: `${line * laneWidth}%` }}
        />
      ))}
      {/* The colour called, on Bérénice's sign. */}
      <span
        key={called}
        className="ui-pop-in absolute top-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-md bg-[#fbf6ea] px-3 py-1 font-display text-xl shadow-[2px_3px_0_var(--ui-shadow)]"
      >
        <BalloonShape color={called} className="h-6 w-5" />
        {t('call', { color: t(`colors.${called}`) })}
      </span>
      {flying.map(({ balloon, index, share }) => {
        const { left, bottom } = placeOf(balloon, index, share ?? 0);
        return (
          <span
            key={index}
            aria-hidden="true"
            data-balloon={index}
            className={`pointer-events-none absolute -translate-x-1/2 ${
              highest.has(index) ? 'drop-shadow-[0_0_6px_rgb(255_255_255/90%)]' : ''
            }`}
            style={{ left: `${left}%`, bottom: `${bottom}%` }}
          >
            <BalloonShape color={balloon.color} className="h-14 w-11 sm:h-16 sm:w-12" />
          </span>
        );
      })}
      {bursts.map((moment) => {
        const balloon = balloons[moment.balloon];
        const share = Math.min(0.999, (moment.at - balloon.at) / balloon.rise);
        const { left, bottom } = placeOf(balloon, moment.balloon, share);
        return (
          <span
            key={`${moment.kind}-${moment.at}`}
            aria-hidden="true"
            className="pointer-events-none absolute -translate-x-1/2"
            style={{ left: `${left}%`, bottom: `${bottom + 6}%` }}
          >
            <span
              className={`ui-pop-in block text-4xl ${moment.kind === 'wrong' ? 'text-ui-danger' : ''}`}
              style={{
                color: moment.kind === 'wrong' ? undefined : BALLOON_HUES[balloon.color].fill,
              }}
            >
              ✸
            </span>
            <span
              className={`ui-float-up absolute -top-6 left-1/2 -translate-x-1/2 font-display text-lg whitespace-nowrap drop-shadow-[0_1px_0_#fbf6ea] ${
                moment.kind === 'wrong' ? 'text-ui-danger' : 'text-[#3f8a6a]'
              }`}
            >
              {t(`moments.${moment.kind}`)}
            </span>
          </span>
        );
      })}
      {state.moments
        .filter((moment) => moment.kind === 'streak' && state.now - moment.at < MOMENT_MS)
        .map((moment) => (
          <span
            key={moment.at}
            aria-hidden="true"
            className="ui-float-up pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 font-display text-2xl text-[#3f8a6a] drop-shadow-[0_1px_0_#fbf6ea]"
          >
            {t('moments.streak')}
          </span>
        ))}
    </div>
  );
}

// A balloon: its round body with a shine, its knot and its string.
// The balloon drawn under a point, or the nearest one within a finger's slack, by its index.
function touchedBalloon(board: HTMLElement, x: number, y: number): number | null {
  let touched: number | null = null;
  let nearest = Number.POSITIVE_INFINITY;
  for (const element of board.querySelectorAll<HTMLElement>('[data-balloon]')) {
    const box = element.getBoundingClientRect();
    const dx = Math.max(box.left - x, 0, x - box.right);
    const dy = Math.max(box.top - y, 0, y - box.bottom);
    const distance = Math.hypot(dx, dy);
    if (distance <= TOUCH_SLACK && distance < nearest) {
      touched = Number(element.dataset.balloon);
      nearest = distance;
    }
  }
  return touched;
}

function BalloonShape({ color, className }: { color: BalloonColor; className: string }) {
  const { fill, shine } = BALLOON_HUES[color];
  return (
    <svg aria-hidden="true" viewBox="0 0 40 56" className={className}>
      <path d="M20 40 Q18 48 22 56" fill="none" stroke="#6b4a2e" strokeWidth="1.2" />
      <ellipse cx="20" cy="18" rx="15" ry="18" fill={fill} />
      <ellipse cx="14" cy="11" rx="4" ry="6" fill={shine} opacity="0.8" />
      <path d="M17 36 L23 36 L20 41 Z" fill={fill} />
    </svg>
  );
}

function remarkOf(
  state: BalloonsState,
  t: ReturnType<typeof useTranslations<'Balloons.balloons'>>,
  color: string,
) {
  const last = state.moments.at(-1);
  if (last && state.now - last.at < REMARK_MS) {
    return t(`berenice.${last.kind}`);
  }
  return state.score === 0 && state.mistakes === 0
    ? t('berenice.start')
    : t('berenice.calm', { color });
}
