'use client';

import { useTranslations } from 'next-intl';
import {
  type CSSProperties,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  canCut,
  flightOf,
  heightOf,
  inAir,
  laneStroke,
  SLICING_LANES,
  SLICING_MISTAKE_LIMIT,
  type SlicingState,
  simulateSlicing,
  slicingPoints,
  slicingThrows,
  strokeOf,
  type Thrown,
} from '@/game/dojo-slicing';
import { drawThrown, type ThrownLook } from './paper-art';
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

const MOMENT_MS = 900;
const REMARK_MS = 1600;
// How long the halves of a cut vegetable, or the shards of a pot, stay on the board.
const PIECES_MS = 550;
// How long a stroke keeps the throws it touched before cutting them, when it touches them quickly.
const RETRY_MS = 30;
const TRAIL_MS = 160;

const LOOKS = ['carrot', 'radish', 'pepper', 'eggplant', 'cabbage', 'pot'] as const;
// The colour of each one's juice, or of the pot's clay, and the ways its drops fly.
const SPLASH_COLORS: Record<ThrownLook, string> = {
  carrot: '#f08a3a',
  radish: '#e05a7e',
  pepper: '#f0c43a',
  eggplant: '#b98ad6',
  cabbage: '#9fd06e',
  pot: '#b5652a',
};
const SPLASH = [
  [-2.4, -1.6],
  [2.2, -2],
  [-1.2, 1.8],
  [1.8, 1.4],
  [0, -2.6],
  [-2.8, 0.4],
  [2.8, 0.2],
] as const;
// The drawings of what is thrown, made once.
const THROWN_DRAWINGS = Object.fromEntries(LOOKS.map((look) => [look, drawThrown(look)])) as Record<
  ThrownLook,
  ReturnType<typeof drawThrown>
>;

// Where a throw is on the board, in percent from the left and from the bottom, and how it turns.
function placeOf(thrown: Thrown, index: number, share: number) {
  const laneWidth = 100 / SLICING_LANES;
  const drift = ((index % 3) - 1) * 0.18 * laneWidth * share;
  return {
    left: laneWidth * (thrown.lane + 0.5) + drift,
    bottom: 4 + heightOf(share) * 68,
    turn: (index % 2 === 0 ? 1 : -1) * share * 300,
  };
}

// How far a point is from a segment, in pixels.
function distanceToSegment(
  point: { x: number; y: number },
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = dx * dx + dy * dy;
  const share =
    length === 0
      ? 0
      : Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / length));
  return Math.hypot(point.x - (from.x + dx * share), point.y - (from.y + dy * share));
}

// Slicing at the dojo: vegetables thrown up in four lanes, cut by sweeping the blade through them,
// or, one lane at a time, by the lane buttons or the keys 1 to 4.
export function SlicingShift({ onDone }: { onDone: (end: ShiftEnd) => void }) {
  const t = useTranslations('Dojo.slicing');
  const box = useRef<HTMLDivElement>(null);
  const simulate = useCallback(simulateSlicing, []);
  const { phase, state, start, press, secondsLeft } = useShift('slicing', simulate, slicingPoints);
  const isPlaying = phase.step === 'playing';
  const seed = phase.step === 'playing' ? phase.seed : 0;
  const throws = useMemo(() => slicingThrows(seed), [seed]);
  const cut = (stroke: number) => press(stroke, (now) => canCut(now, throws, stroke));

  return (
    <ShiftFrame
      host="dojoMaster"
      job="slicing"
      phase={phase}
      secondsLeft={secondsLeft}
      howTo={t('howTo')}
      onStart={start}
      onDone={onDone}
      onKeyDown={digitKeys(isPlaying, SLICING_LANES, (lane) => cut(laneStroke(lane)))}
      box={box}
    >
      {state && (
        <>
          <ScoreLine
            points={slicingPoints(state)}
            mistakes={state.mistakes}
            limit={SLICING_MISTAKE_LIMIT}
          />
          <Board state={state} throws={throws} onStroke={cut} />
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {Array.from({ length: SLICING_LANES }, (_, lane) => lane).map((lane) => (
              <button
                key={lane}
                type="button"
                {...pressHandlers(() => cut(laneStroke(lane)))}
                className="flex min-h-11 cursor-pointer touch-manipulation items-center justify-center gap-1 rounded-sm bg-[#6b4a2e] px-1 text-[#fbf6ea] shadow-[2px_3px_0_var(--ui-shadow)] outline-none select-none active:translate-y-0.5 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp"
              >
                <kbd className="font-digits text-xs opacity-70 pointer-coarse:hidden">
                  {lane + 1}
                </kbd>
                <span aria-hidden="true">🔪</span>
                <span className="sr-only">{t('lane', { number: lane + 1 })}</span>
              </button>
            ))}
          </div>
          <HostSays host="dojoMaster" text={remarkOf(state, t)} />
        </>
      )}
    </ShiftFrame>
  );
}

type TrailPoint = { x: number; y: number; at: number };

// The board: the throws in flight, the pieces of those just cut, and the blade's trail. A swipe
// cuts the throws it passes through: those touched quicker than a stroke can follow together.
function Board({
  state,
  throws,
  onStroke,
}: {
  state: SlicingState;
  throws: readonly Thrown[];
  onStroke: (stroke: number) => boolean;
}) {
  const t = useTranslations('Dojo.slicing');
  const board = useRef<HTMLDivElement>(null);
  // The throws the blade touched, by their index, waiting to be cut.
  const pending = useRef(new Set<number>());
  const retry = useRef<number | null>(null);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const isDown = useRef(false);
  // The board as last drawn, for the stroke to name the throws it touched.
  const latest = useRef(state);
  latest.current = state;

  useEffect(
    () => () => {
      if (retry.current !== null) {
        window.clearTimeout(retry.current);
      }
    },
    [],
  );

  // Cuts the throws the blade touched, or tries again a moment later if it came too soon after the
  // last stroke. Those that landed meanwhile are let go.
  const flush = useCallback(() => {
    retry.current = null;
    const stroke = strokeOf(latest.current, throws, pending.current);
    if (stroke === 0 || onStroke(stroke)) {
      pending.current.clear();
    } else {
      retry.current = window.setTimeout(flush, RETRY_MS);
    }
  }, [onStroke, throws]);

  // The blade's last point on the board, in pixels, while the button or the finger is down.
  const previous = useRef<{ x: number; y: number } | null>(null);

  // The blade moves from its last point to this one, and cuts the throws it passes through. Only a
  // moving blade cuts, and only what it touches.
  const swipeTo = (event: PointerEvent<HTMLDivElement>) => {
    const box = board.current?.getBoundingClientRect();
    if (!box) {
      return;
    }
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    const now = performance.now();
    setTrail((points) => [
      ...points.filter((point) => now - point.at < TRAIL_MS),
      { x: (x / box.width) * 100, y: (y / box.height) * 100, at: now },
    ]);
    const from = previous.current;
    previous.current = { x, y };
    if (!from) {
      return;
    }
    const shown = latest.current;
    const size = window.matchMedia('(min-width: 40rem)').matches ? 80 : 64;
    const reach = size * 0.42;
    let touched = false;
    for (const index of inAir(shown, throws)) {
      const thrown = throws[index];
      const place = placeOf(thrown, index, flightOf(thrown, shown.now) ?? 0);
      const center = {
        x: (place.left / 100) * box.width,
        y: box.height * (1 - place.bottom / 100) - size / 2,
      };
      if (!pending.current.has(index) && distanceToSegment(center, from, { x, y }) <= reach) {
        pending.current.add(index);
        touched = true;
      }
    }
    if (touched && retry.current === null) {
      flush();
    }
  };

  // The trail fades away on its own once the blade stops.
  useEffect(() => {
    if (trail.length === 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      const now = performance.now();
      setTrail((points) => points.filter((point) => now - point.at < TRAIL_MS));
    }, TRAIL_MS);
    return () => window.clearTimeout(timer);
  }, [trail]);

  const flying = inAir(state, throws);
  const pieces = [...state.ends.entries()].filter(
    ([, end]) => end.kind !== 'dropped' && state.now - end.at < PIECES_MS,
  );
  const floats = state.moments.filter(
    (moment) => moment.kind !== 'cut' && state.now - moment.at < MOMENT_MS,
  );
  const laneWidth = 100 / SLICING_LANES;

  return (
    <div
      ref={board}
      role="img"
      aria-label={t('board')}
      onPointerDown={(event) => {
        isDown.current = true;
        pending.current.clear();
        previous.current = null;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        swipeTo(event);
      }}
      onPointerMove={(event) => {
        if (isDown.current) {
          swipeTo(event);
        }
      }}
      onPointerUp={() => {
        isDown.current = false;
        previous.current = null;
      }}
      onPointerCancel={() => {
        isDown.current = false;
        previous.current = null;
      }}
      className="relative mt-2 h-72 cursor-crosshair touch-none overflow-hidden rounded-sm bg-[linear-gradient(#fbf3df_0_78%,#cdbf86_78%)] select-none sm:h-80"
    >
      {/* The paper screens behind, in their wooden grid. */}
      <span className="absolute inset-x-0 top-0 h-[78%] bg-[linear-gradient(90deg,rgb(107_74_46/22%)_0_3px,transparent_3px),linear-gradient(rgb(107_74_46/22%)_0_3px,transparent_3px)] bg-size-[3.25rem_4rem]" />
      <span className="absolute inset-x-0 top-[78%] h-1.5 bg-[#3f2a1c]" />
      {/* The lanes, faintly marked, with their numbers on the floor. */}
      {Array.from({ length: SLICING_LANES - 1 }, (_, line) => line + 1).map((line) => (
        <span
          key={line}
          className="absolute inset-y-0 border-l-2 border-dashed border-ui-ink/10"
          style={{ left: `${line * laneWidth}%` }}
        />
      ))}
      {Array.from({ length: SLICING_LANES }, (_, lane) => lane).map((lane) => (
        <span
          key={lane}
          aria-hidden="true"
          className="absolute bottom-1 -translate-x-1/2 font-digits text-sm text-ui-ink/35 pointer-coarse:hidden"
          style={{ left: `${(lane + 0.5) * laneWidth}%` }}
        >
          {lane + 1}
        </span>
      ))}
      {flying.map((index) => {
        const thrown = throws[index];
        const share = flightOf(thrown, state.now) ?? 0;
        const { left, bottom, turn } = placeOf(thrown, index, share);
        return (
          <span
            key={index}
            className="pointer-events-none absolute size-16 -translate-x-1/2 sm:size-20"
            style={{ left: `${left}%`, bottom: `${bottom}%`, rotate: `${turn}deg` }}
          >
            <CanvasArt
              draw={THROWN_DRAWINGS[thrown.kind]}
              width={128}
              height={128}
              className="size-full drop-shadow-[0_3px_0_rgb(0_0_0/18%)]"
            />
          </span>
        );
      })}
      {pieces.map(([index, end]) => {
        const thrown = throws[index];
        const share = Math.min(0.999, Math.max(0, (end.at - thrown.at) / thrown.air));
        const { left, bottom, turn } = placeOf(thrown, index, share);
        const isPot = end.kind === 'broken';
        return (
          <span
            key={`piece-${index}`}
            className="pointer-events-none absolute size-16 -translate-x-1/2 sm:size-20"
            style={{ left: `${left}%`, bottom: `${bottom}%` }}
          >
            {(['left', 'right'] as const).map((half) => (
              <span
                key={half}
                className={`absolute inset-0 ${half === 'left' ? 'ui-half-left' : 'ui-half-right'}`}
                style={{
                  clipPath: half === 'left' ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
                }}
              >
                <span className="absolute inset-0" style={{ rotate: `${turn}deg` }}>
                  <CanvasArt
                    draw={THROWN_DRAWINGS[thrown.kind]}
                    width={128}
                    height={128}
                    className={`size-full ${isPot ? 'opacity-80' : ''}`}
                  />
                </span>
              </span>
            ))}
            {SPLASH.map(([dx, dy]) => (
              <span
                key={`${dx}-${dy}`}
                aria-hidden="true"
                className="ui-splash absolute top-1/2 left-1/2 size-2.5 rounded-full"
                style={
                  {
                    background: SPLASH_COLORS[thrown.kind],
                    '--dx': `${dx}rem`,
                    '--dy': `${dy}rem`,
                  } as CSSProperties
                }
              />
            ))}
            {!isPot && (
              <span
                aria-hidden="true"
                className="ui-float-up absolute inset-x-0 top-1/2 h-1 -rotate-25 rounded-full bg-white/90"
              />
            )}
          </span>
        );
      })}
      {/* The blade's trail. */}
      {trail.length > 1 && (
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <polyline
            points={trail.map((point) => `${point.x},${point.y}`).join(' ')}
            fill="none"
            stroke="white"
            strokeOpacity="0.9"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 6, filter: 'drop-shadow(0 0 3px rgb(120 170 220 / 90%))' }}
          />
        </svg>
      )}
      {floats.map((moment) => (
        <span
          key={`${moment.kind}-${moment.at}-${moment.lane}`}
          aria-hidden="true"
          className={`ui-float-up pointer-events-none absolute top-[18%] -translate-x-1/2 font-display text-xl whitespace-nowrap drop-shadow-[0_1px_0_#fbf6ea] ${
            moment.kind === 'clean' || moment.kind === 'combo' ? 'text-[#3f8a6a]' : 'text-ui-danger'
          }`}
          style={{
            left: `${Math.min(84, Math.max(16, (moment.lane + 0.5) * laneWidth))}%`,
            top: moment.kind === 'combo' ? '8%' : moment.kind === 'dropped' ? '62%' : '20%',
          }}
        >
          {moment.kind === 'combo'
            ? t('moments.combo', { count: moment.count ?? 2 })
            : t(`moments.${moment.kind as 'clean'}`)}
        </span>
      ))}
    </div>
  );
}

function remarkOf(state: SlicingState, t: ReturnType<typeof useTranslations<'Dojo.slicing'>>) {
  const last = state.moments.at(-1);
  const recent = last && state.now - last.at < REMARK_MS ? last : null;
  if (recent) {
    return t(`kaito.${recent.kind}`);
  }
  return state.cut === 0 && state.mistakes === 0 ? t('kaito.start') : t('kaito.calm');
}
