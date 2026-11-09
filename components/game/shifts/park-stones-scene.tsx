'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useCallback, useMemo, useRef } from 'react';
import {
  angleAt,
  BEST_STRENGTH,
  canThrow,
  landsAt,
  PEBBLES,
  pebbleReadyAt,
  pebbleSetups,
  SKIP_MS,
  type StonesState,
  simulateStones,
  stonesPoints,
  strengthAt,
} from '@/game/quests/shifts/park-stones';
import { drawPapy, drawReeds, PAPY_SIZE } from '../art/park';
import { drawLakeScenery, LAKE_SCENERY_SIZE } from '../art/park-games';
import { moveThroughChoices } from '../menu-focus';
import { CanvasArt, HostSays, pressHandlers, type ShiftEnd, ShiftFrame, useShift } from './shift';

const MOMENT_MS = 1200;

// The lake's scenery, drawn once when first needed, then copied onto the canvas that shows it.
let lakeScenery: HTMLCanvasElement | null = null;
function drawLake(drawing: CanvasRenderingContext2D, width: number, height: number) {
  lakeScenery ??= drawLakeScenery();
  drawing.drawImage(lakeScenery, 0, 0, width, height);
}
const REMARK_MS = 1800;
// Where a pebble leaves the shore, and how far each skip carries it, in percent of the lake.
const START_X = 24;
const SKIP_STEP = 5.6;

function windOf(wind: number) {
  const strength = Math.abs(wind) < 0.15 ? 'calm' : Math.abs(wind) < 0.55 ? 'light' : 'strong';
  const direction = strength === 'calm' ? 'none' : wind < 0 ? 'left' : 'right';
  return { strength, direction };
}

// Skipping stones with Papy Caillou: the lake, the angle's dial and the strength's gauge. The space
// bar, the button or a touch of the lake holds the angle, then throws.
export function StonesShift({ onDone }: { onDone: (end: ShiftEnd) => void }) {
  const t = useTranslations('Stones.stones');
  const tShift = useTranslations('Shift');
  const box = useRef<HTMLDivElement>(null);
  const simulate = useCallback(simulateStones, []);
  const { phase, state, start, press, showScore, secondsLeft } = useShift(
    'stones',
    simulate,
    stonesPoints,
  );
  const isPlaying = phase.step === 'playing';
  const seed = phase.step === 'playing' ? phase.seed : 0;
  const setups = useMemo(() => pebbleSetups(seed), [seed]);
  const act = () => press(0, canThrow);

  // Space and Enter throw, unless the focus is on another button, such as the one to stop.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const isOtherButton =
      event.target instanceof HTMLElement &&
      event.target.closest('button') !== null &&
      !event.target.closest('[data-aim]');
    if (isPlaying && !isOtherButton && (event.code === 'Space' || event.code === 'Enter')) {
      event.preventDefault();
      if (!event.repeat) {
        act();
      }
      return;
    }
    moveThroughChoices(event);
  };

  const isReady = state !== null && canThrow(state);
  const isHolding = state?.heldAngle !== null && state?.heldAngle !== undefined;

  return (
    <ShiftFrame
      host="grandpa"
      job="stones"
      phase={phase}
      onShowScore={showScore}
      secondsLeft={secondsLeft}
      howTo={t('howTo')}
      onStart={start}
      onDone={onDone}
      onKeyDown={onKeyDown}
      box={box}
    >
      {state && (
        <>
          <div className="mt-1 flex items-center justify-between gap-3 text-lg">
            <span>
              {tShift('points')}{' '}
              <span className="font-digits font-bold tabular-nums">{stonesPoints(state)}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="sr-only">
                {t('pebbles', { count: PEBBLES - state.throws.length })}
              </span>
              {Array.from({ length: PEBBLES }, (_, index) => index).map((index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className={`h-3 w-4 rounded-[50%] ${
                    index < PEBBLES - state.throws.length ? 'bg-[#8a867e]' : 'bg-ui-ink/15'
                  }`}
                />
              ))}
            </span>
          </div>
          <Lake state={state} setups={setups} onThrow={act} />
          <button
            type="button"
            data-first-focus
            data-aim
            {...pressHandlers(act)}
            aria-disabled={!isReady}
            className={`mt-2 flex min-h-14 w-full cursor-pointer touch-manipulation items-center justify-center rounded-sm px-3 text-lg text-[#fbf6ea] shadow-[2px_3px_0_var(--ui-shadow)] outline-none select-none active:translate-y-0.5 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-disabled:opacity-45 ${
              isHolding ? 'bg-[#2f6f8a]' : 'bg-[#3c78b4]'
            }`}
          >
            {!isReady ? t('wait') : isHolding ? t('strength') : t('angle')}
            <kbd className="ml-2 font-digits text-xs opacity-70 pointer-coarse:hidden">␣</kbd>
          </button>
          <HostSays host="grandpa" text={remarkOf(state, setups[state.throws.length]?.wind, t)} />
        </>
      )}
    </ShiftFrame>
  );
}

// The lake from its shore: reeds leaning with the wind, the pebble skipping across with a ripple at
// each touch, the dial of the angle and the gauge of the strength. A touch of the lake throws too.
function Lake({
  state,
  setups,
  onThrow,
}: {
  state: StonesState;
  setups: ReturnType<typeof pebbleSetups>;
  onThrow: () => void;
}) {
  const t = useTranslations('Stones.stones');
  const setup = setups[state.throws.length];
  const ready = pebbleReadyAt(state);
  const isReady = canThrow(state);
  const angle =
    setup && ready !== null && isReady
      ? (state.heldAngle?.angle ?? angleAt(setup, ready, state.now))
      : null;
  const strength = setup && state.heldAngle ? strengthAt(setup, state.heldAngle.at, state.now) : 0;
  const wind = setup ? windOf(setup.wind) : null;
  // The reeds lean with the last pebble's wind while the next is picked up.
  const leaning = (setup ?? setups.at(-1))?.wind ?? 0;
  const last = state.throws.at(-1);
  const isFlying = last !== undefined && state.now < landsAt(last) + 600;
  const floats = state.moments.filter(
    (moment) => moment.at <= state.now && state.now - moment.at < MOMENT_MS,
  );

  return (
    <div
      role="img"
      aria-label={t('lake', { count: state.throws.length })}
      onPointerDown={(event) => {
        event.preventDefault();
        onThrow();
      }}
      className="relative mt-2 h-64 cursor-pointer touch-manipulation overflow-hidden rounded-sm bg-[#5f9fc4] select-none sm:h-72"
    >
      <CanvasArt
        draw={drawLake}
        width={LAKE_SCENERY_SIZE.width}
        height={LAKE_SCENERY_SIZE.height}
        className="absolute inset-0 size-full object-cover object-left-bottom"
      />
      {/* Reeds on the bank and across the water, leaning with the wind. */}
      {[
        { left: 35, bottom: 16, height: 24 },
        { left: 90, bottom: 50, height: 18 },
      ].map(({ left, bottom, height }) => (
        <span
          key={left}
          aria-hidden="true"
          className="absolute origin-bottom -translate-x-1/2 transition-transform duration-700"
          style={{
            left: `${left}%`,
            bottom: `${bottom}%`,
            height: `${height}%`,
            aspectRatio: '220 / 110',
            rotate: `${leaning * 18}deg`,
          }}
        >
          <CanvasArt draw={drawReeds} width={220} height={110} className="size-full" />
        </span>
      ))}
      {/* Papy Caillou, watching from the bank. */}
      <span
        aria-hidden="true"
        className="absolute bottom-[3%] left-[1%] h-[46%]"
        style={{ aspectRatio: `${PAPY_SIZE.width} / ${PAPY_SIZE.height}` }}
      >
        <CanvasArt
          draw={drawPapy}
          width={PAPY_SIZE.width}
          height={PAPY_SIZE.height}
          className="size-full"
        />
      </span>
      {/* The pebble, skipping from touch to touch, and the ripples it leaves. */}
      {last &&
        isFlying &&
        Array.from({ length: Math.max(1, last.skips) }, (_, skip) => skip).map((skip) => {
          const touchAt = last.at + (skip + 1) * SKIP_MS;
          const since = state.now - touchAt;
          return since >= 0 ? (
            <span
              key={skip}
              aria-hidden="true"
              className="absolute h-3 w-10 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-white/80"
              style={{
                left: `${START_X + (skip + 1) * SKIP_STEP}%`,
                top: '62%',
                scale: `${1 + Math.min(1.5, since / 400)}`,
                opacity: Math.max(0, 1 - since / 900),
              }}
            />
          ) : null;
        })}
      {last && state.now < landsAt(last) && (
        <span
          aria-hidden="true"
          className="absolute h-2.5 w-4 -translate-x-1/2 rounded-[50%] bg-[#6d6a62] shadow-[0_1px_0_rgb(0_0_0/30%)]"
          style={(() => {
            const flown = (state.now - last.at) / SKIP_MS;
            const hop = flown - Math.floor(flown);
            return {
              left: `${START_X + flown * SKIP_STEP}%`,
              top: `${62 - Math.sin(hop * Math.PI) * 12}%`,
            };
          })()}
        />
      )}
      {/* The dial of the angle and the gauge of the strength, together on a card at the bottom
          right so that they read clearly over the water. */}
      {angle !== null && (
        <span
          aria-hidden="true"
          className="absolute right-2 bottom-2 flex items-end gap-2.5 rounded-md bg-[#fbf6ea]/95 p-2 shadow-[2px_3px_0_var(--ui-shadow)]"
        >
          {/* The angle: flat to the right, steep upwards. */}
          <span className="relative block size-16 overflow-hidden rounded-tr-full border-t-4 border-r-4 border-ui-ink/35 bg-[#cfe6f2] sm:size-20">
            <span
              className="absolute bottom-0 left-0 h-0.5 w-[92%] origin-left rounded-full bg-ui-ink/25"
              style={{ rotate: '-45deg' }}
            />
            <span
              className={`absolute bottom-0 left-0 h-1.5 w-[95%] origin-left rounded-full ${
                state.heldAngle ? 'bg-[#e8a33e]' : 'bg-[#c8453a]'
              }`}
              style={{ rotate: `${-angle * 90}deg` }}
            />
          </span>
          {/* The strength: the green band is where a throw is best, waiting until the angle is
              held. */}
          <span
            className={`relative block h-16 w-5 overflow-hidden rounded-full border-2 border-ui-ink/35 bg-white sm:h-20 ${
              state.heldAngle ? '' : 'opacity-50'
            }`}
          >
            <span
              className="absolute inset-x-0 bottom-0 bg-[#e8b33e]"
              style={{ height: `${strength * 100}%` }}
            />
            <span
              className="absolute inset-x-0 border-y-2 border-[#2f7a3a] bg-[#5fbf5a]/45"
              style={{ bottom: `${(BEST_STRENGTH - 0.1) * 100}%`, height: '20%' }}
            />
          </span>
        </span>
      )}
      {wind && (
        <span className="absolute top-2 left-2 rounded-sm bg-[#fbf6ea]/90 px-2 py-1 text-sm">
          {t('wind', wind)}
        </span>
      )}
      {floats.map((moment) => (
        <span
          key={`${moment.kind}-${moment.at}`}
          aria-hidden="true"
          className={`ui-float-up pointer-events-none absolute left-1/2 -translate-x-1/2 font-display text-2xl whitespace-nowrap drop-shadow-[0_1px_0_#2c2a35] ${
            moment.kind === 'sank' ? 'text-[#fbf6ea]' : 'text-[#ffe08a]'
          }`}
          style={{ top: moment.kind === 'champion' ? '6%' : '16%' }}
        >
          {t(`moments.${moment.kind}`, { skips: moment.skips })}
        </span>
      ))}
    </div>
  );
}

function remarkOf(
  state: StonesState,
  wind: number | undefined,
  t: ReturnType<typeof useTranslations<'Stones.stones'>>,
) {
  const last = state.moments.filter((moment) => moment.at <= state.now).at(-1);
  if (last && state.now - last.at < REMARK_MS) {
    return t(`papy.${last.kind}`);
  }
  if (wind !== undefined && Math.abs(wind) >= 0.55) {
    return t('papy.wind');
  }
  return state.throws.length === 0 ? t('papy.start') : t('papy.calm');
}
