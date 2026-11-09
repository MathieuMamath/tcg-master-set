'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useCallback, useMemo, useRef } from 'react';
import {
  ARROWS,
  type ArcheryState,
  archeryPoints,
  arrowSetups,
  canAim,
  FLIGHT_MS,
  RINGS,
  readyAt,
  SWEEP,
  simulateArchery,
  sweepX,
  sweepY,
  windCarries,
} from '@/game/dojo-archery';
import { moveThroughChoices } from './menu-focus';
import { drawArcheryTarget, drawDojoGarden } from './paper-art';
import { CanvasArt, HostSays, pressHandlers, type ShiftEnd, ShiftFrame, useShift } from './shift';

const MOMENT_MS = 1100;
const REMARK_MS = 1800;
// The target's radius on the board, in percent of the board's height, and where its centre is.
const TARGET_RADIUS = 30;
const TARGET_TOP = 38;
// The target's drawing: its canvas, the outer scoring ring's radius in it, and its centre's height.
const TARGET_CANVAS = { width: 200, height: 260, ring: 94 * 0.92, centerY: 100 };
// The outer ring drawn is the last that scores, at 0.85 of the rules' unit.
const TARGET_WIDTH =
  (TARGET_RADIUS * TARGET_CANVAS.width * RINGS[RINGS.length - 1].radius) / TARGET_CANVAS.ring;
const TARGET_HEIGHT = (TARGET_WIDTH * TARGET_CANVAS.height) / TARGET_CANVAS.width;

// How a wind blows, for its pennant and its words.
function windOf(wind: number) {
  const strength = Math.abs(wind) < 0.15 ? 'calm' : Math.abs(wind) < 0.55 ? 'light' : 'strong';
  const direction = strength === 'calm' ? 'none' : wind < 0 ? 'left' : 'right';
  return { strength, direction };
}

// Archery in the dojo's garden: the target, the two sweeping lines, the wind's pennant, and the
// bow. The space bar, the button or a touch of the range holds the first line, then the second,
// which looses the arrow.
export function ArcheryShift({ onDone }: { onDone: (end: ShiftEnd) => void }) {
  const t = useTranslations('Dojo.archery');
  const tShift = useTranslations('Shift');
  const box = useRef<HTMLDivElement>(null);
  const simulate = useCallback(simulateArchery, []);
  const { phase, state, start, press, showScore, secondsLeft } = useShift(
    'archery',
    simulate,
    archeryPoints,
  );
  const isPlaying = phase.step === 'playing';
  const seed = phase.step === 'playing' ? phase.seed : 0;
  const setups = useMemo(() => arrowSetups(seed), [seed]);
  const aim = () => press(0, canAim);

  // Space and Enter aim, unless the focus is on another button, such as the one to stop, which
  // they must press as usual.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const isOtherButton =
      event.target instanceof HTMLElement &&
      event.target.closest('button') !== null &&
      !event.target.closest('[data-aim]');
    if (isPlaying && !isOtherButton && (event.code === 'Space' || event.code === 'Enter')) {
      event.preventDefault();
      if (!event.repeat) {
        aim();
      }
      return;
    }
    moveThroughChoices(event);
  };

  const isReady = state !== null && canAim(state);
  const isHolding = state?.heldX !== null && state?.heldX !== undefined;

  return (
    <ShiftFrame
      host="dojoMaster"
      job="archery"
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
              <span className="font-digits font-bold tabular-nums">{archeryPoints(state)}</span>
            </span>
            <Quiver left={ARROWS - state.shots.length} />
          </div>
          <Range state={state} setups={setups} onAim={aim} />
          <button
            type="button"
            data-first-focus
            data-aim
            {...pressHandlers(aim)}
            aria-disabled={!isReady}
            className={`mt-2 flex min-h-14 w-full cursor-pointer touch-manipulation items-center justify-center rounded-sm px-3 text-lg text-[#fbf6ea] shadow-[2px_3px_0_var(--ui-shadow)] outline-none select-none active:translate-y-0.5 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-disabled:opacity-45 ${
              isHolding ? 'bg-[#7a3a22]' : 'bg-[#6b4a2e]'
            }`}
          >
            {!isReady ? t('wait') : isHolding ? t('aimY') : t('aimX')}
            <kbd className="ml-2 font-digits text-xs opacity-70 pointer-coarse:hidden">␣</kbd>
          </button>
          <HostSays host="dojoMaster" text={remarkOf(state, setups[state.shots.length]?.wind, t)} />
        </>
      )}
    </ShiftFrame>
  );
}

function Quiver({ left }: { left: number }) {
  const t = useTranslations('Dojo.archery');
  return (
    <span className="flex items-center gap-1">
      <span className="sr-only">{t('arrows', { count: left })}</span>
      {Array.from({ length: ARROWS }, (_, index) => index).map((index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`h-5 w-1 rounded-full ${index < left ? 'bg-[#7a3a22]' : 'bg-ui-ink/15'}`}
        />
      ))}
    </span>
  );
}

// The range, out in the dojo's garden, where the wind blows: the target on its stand on the lawn,
// the arrows already in it, the one in flight, the two lines, and the wind's pennant. A touch of the
// range aims too.
function Range({
  state,
  setups,
  onAim,
}: {
  state: ArcheryState;
  setups: ReturnType<typeof arrowSetups>;
  onAim: () => void;
}) {
  const t = useTranslations('Dojo.archery');
  const setup = setups[state.shots.length];
  const ready = readyAt(state);
  const isReady = canAim(state);
  // The side-to-side line, sweeping or held, and the up-and-down one once the first is held.
  const lineX =
    setup && ready !== null && isReady ? (state.heldX?.x ?? sweepX(setup, ready, state.now)) : null;
  const lineY = setup && state.heldX ? sweepY(setup, state.heldX.at, state.now) : null;
  const wind = setup ? windOf(setup.wind) : null;
  const last = state.shots.at(-1);
  const flight = last ? Math.min(1, (state.now - last.at) / FLIGHT_MS) : 1;
  const landed = flight >= 1 ? state.shots : state.shots.slice(0, -1);
  const floats = state.moments.filter(
    (moment) => state.now - moment.at < MOMENT_MS && moment.at <= state.now,
  );
  const draw = state.heldX ? 1 : 0;
  // A point on the target, in percent of the board: across from its centre, and up from it.
  const at = (x: number, y: number) => ({
    left: `calc(50% + ${x * TARGET_RADIUS}cqh)`,
    top: `${TARGET_TOP - y * TARGET_RADIUS}%`,
  });

  return (
    <div
      role="img"
      aria-label={t('target', { count: landed.filter((shot) => shot.points > 0).length })}
      onPointerDown={(event) => {
        event.preventDefault();
        onAim();
      }}
      className="relative mt-2 h-72 cursor-crosshair touch-manipulation overflow-hidden rounded-sm bg-[#8cbf5f] select-none [container-type:size] sm:h-80"
    >
      <CanvasArt
        draw={drawDojoGarden}
        width={640}
        height={320}
        className="absolute inset-0 size-full object-cover"
      />
      {/* The target on its stand. */}
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: '50%',
          top: `${TARGET_TOP + TARGET_HEIGHT * (0.5 - TARGET_CANVAS.centerY / TARGET_CANVAS.height)}%`,
          width: `${TARGET_WIDTH}cqh`,
          height: `${TARGET_HEIGHT}cqh`,
        }}
      >
        <CanvasArt
          draw={drawArcheryTarget}
          width={TARGET_CANVAS.width}
          height={TARGET_CANVAS.height}
          className="size-full drop-shadow-[0_3px_0_rgb(0_0_0/15%)]"
        />
      </span>
      {/* The arrows in the target. */}
      {landed.map((shot) => (
        // An arrow seen from behind: its shaft's end and four feathers.
        <svg
          key={shot.at}
          aria-hidden="true"
          viewBox="-10 -10 20 20"
          className="absolute size-5 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_1px_0_rgb(0_0_0/25%)]"
          style={at(shot.x, shot.y)}
        >
          {[0, 90, 180, 270].map((angle) => (
            <path
              key={angle}
              d="M0 0 L8 -2.5 L8 2.5 Z"
              fill="#c8453a"
              transform={`rotate(${angle + 45})`}
            />
          ))}
          <circle r="3" fill="#3f2a1c" stroke="#fbf6ea" strokeWidth="1.2" />
        </svg>
      ))}
      {/* The arrow in flight, shrinking as it goes away. */}
      {last && flight < 1 && (
        <span
          aria-hidden="true"
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7a3a22]"
          style={{
            left: `calc(50% + ${last.x * TARGET_RADIUS * flight}cqh)`,
            top: `${96 - (96 - (TARGET_TOP - last.y * TARGET_RADIUS)) * flight}%`,
            scale: `${3 - flight * 2}`,
          }}
        />
      )}
      {/* The side-to-side line, sweeping then held, and where the wind will carry the arrow. */}
      {lineX !== null && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute w-1 -translate-x-1/2 rounded-full ${
            state.heldX ? 'bg-[#3f8a6a]' : 'bg-[#c8453a] shadow-[0_0_6px_rgb(255_255_255/80%)]'
          }`}
          style={{
            left: `calc(50% + ${lineX * TARGET_RADIUS}cqh)`,
            top: `${TARGET_TOP - SWEEP * TARGET_RADIUS}%`,
            height: `${2 * SWEEP * TARGET_RADIUS}%`,
          }}
        />
      )}
      {setup && state.heldX && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute w-0 -translate-x-1/2 border-l-2 border-dashed border-white/80"
          style={{
            left: `calc(50% + ${windCarries(setup, state.heldX.x) * TARGET_RADIUS}cqh)`,
            top: `${TARGET_TOP - SWEEP * TARGET_RADIUS}%`,
            height: `${2 * SWEEP * TARGET_RADIUS}%`,
          }}
        />
      )}
      {/* The up-and-down line, and the sight where the two cross. */}
      {lineY !== null && lineX !== null && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-1 -translate-y-1/2 rounded-full bg-[#c8453a] shadow-[0_0_6px_rgb(255_255_255/80%)]"
            style={{
              left: `calc(50% - ${SWEEP * TARGET_RADIUS}cqh)`,
              width: `${2 * SWEEP * TARGET_RADIUS}cqh`,
              top: `${TARGET_TOP - lineY * TARGET_RADIUS}%`,
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white"
            style={at(lineX, lineY)}
          />
        </>
      )}
      {/* The wind's pennant, top left, and its words. */}
      {wind && (
        <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-sm bg-[#fbf6ea]/90 px-2 py-1 text-sm">
          {/* The pole in the middle of its box, the pennant flying from it with the wind. */}
          <span aria-hidden="true" className="relative h-6 w-12 shrink-0">
            <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-[#3f2a1c]" />
            <span
              className={`absolute top-0 h-4 bg-[#c8453a] ${
                wind.strength === 'calm' ? '' : 'ui-flutter'
              } ${setup.wind < 0 ? 'origin-right' : 'origin-left'}`}
              style={{
                left: setup.wind < 0 ? 'auto' : 'calc(50% + 0.125rem)',
                right: setup.wind < 0 ? 'calc(50% + 0.125rem)' : 'auto',
                width: `${0.3 + Math.abs(setup.wind) * 1.15}rem`,
                clipPath:
                  setup.wind < 0
                    ? 'polygon(100% 0, 0 50%, 100% 100%)'
                    : 'polygon(0 0, 100% 50%, 0 100%)',
              }}
            />
          </span>
          {t('wind', wind)}
        </span>
      )}
      {/* The bow, at the bottom, drawn once the first line is held. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 60"
        className="absolute bottom-1 left-1/2 h-16 -translate-x-1/2"
      >
        <path
          d="M10 50 Q60 0 110 50"
          fill="none"
          stroke="#7a3a22"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d={`M10 50 L60 ${50 + draw * 8} L110 50`}
          fill="none"
          stroke="#e8e2d4"
          strokeWidth="2"
        />
        {isReady && (
          <path d={`M60 ${50 + draw * 8} L60 ${8 + draw * 8}`} stroke="#3f2a1c" strokeWidth="3" />
        )}
      </svg>
      {floats.map((moment) => (
        <span
          key={`${moment.kind}-${moment.at}`}
          aria-hidden="true"
          className={`ui-float-up pointer-events-none absolute left-1/2 -translate-x-1/2 font-display text-2xl whitespace-nowrap drop-shadow-[0_1px_0_#fbf6ea] ${
            moment.kind === 'miss' ? 'text-ui-danger' : 'text-[#3f8a6a]'
          }`}
          style={{ top: moment.kind === 'streak' ? '4%' : '12%' }}
        >
          {t(`moments.${moment.kind}`, { points: moment.points })}
        </span>
      ))}
    </div>
  );
}

function remarkOf(
  state: ArcheryState,
  wind: number | undefined,
  t: ReturnType<typeof useTranslations<'Dojo.archery'>>,
) {
  const last = state.moments.filter((moment) => moment.at <= state.now).at(-1);
  if (last && state.now - last.at < REMARK_MS) {
    return t(`kaito.${last.kind}`);
  }
  if (wind !== undefined && Math.abs(wind) >= 0.55) {
    return t('kaito.wind');
  }
  return t('kaito.start');
}
