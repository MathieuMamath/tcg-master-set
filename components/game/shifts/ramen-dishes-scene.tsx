'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';
import {
  CARRY_MS,
  canDo,
  DISH_ACTIONS,
  DISHES_MISTAKE_LIMIT,
  type DishAction,
  type DishesMoment,
  type DishesState,
  dirtyBowls,
  dishesPoints,
  pileBonus,
  simulateDishes,
  TUB_LIMIT,
} from '@/game/quests/shifts/ramen-dishes';
import { drawSinkBackdrop, drawSponge, drawWashBowl } from '../art/ramen';
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
// How far a finger or the mouse travels over the bowl for one scrub.
const RUB_PER_SCRUB = 70;

const BUTTON_CLASS =
  'flex min-h-14 cursor-pointer touch-manipulation flex-col items-center justify-center rounded-sm px-1 py-1.5 text-center leading-tight shadow-[2px_3px_0_var(--ui-shadow)] outline-none select-none active:translate-y-0.5 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-disabled:opacity-45';

// Washing up at Ramen Yuzu: the tub of dirty bowls, the sink, and the pile to carry to Yuzu.
export function DishesShift({ onDone }: { onDone: (end: ShiftEnd) => void }) {
  const t = useTranslations('Ramen.dishes');
  const box = useRef<HTMLDivElement>(null);
  const simulate = useCallback(simulateDishes, []);
  const { phase, state, start, press, showScore, secondsLeft } = useShift(
    'dishes',
    simulate,
    dishesPoints,
  );
  const isPlaying = phase.step === 'playing';
  const act = (action: DishAction) =>
    press(DISH_ACTIONS.indexOf(action), (now) => canDo(now, action));
  const rubbed = useRef<{ x: number; y: number; distance: number } | null>(null);
  const seed = phase.step === 'playing' ? phase.seed : 0;
  const bowls = useMemo(() => dirtyBowls(seed), [seed]);

  return (
    <ShiftFrame
      host="ramenChef"
      job="dishes"
      phase={phase}
      onShowScore={showScore}
      secondsLeft={secondsLeft}
      howTo={t('howTo')}
      onStart={start}
      onDone={onDone}
      onKeyDown={digitKeys(isPlaying, DISH_ACTIONS.length, (choice) => act(DISH_ACTIONS[choice]))}
      box={box}
    >
      {state && (
        <>
          <ScoreLine
            points={dishesPoints(state)}
            mistakes={state.mistakes}
            limit={DISHES_MISTAKE_LIMIT}
          />
          <div className="relative mt-2 grid grid-cols-[1fr_2fr_1fr] items-end gap-2 rounded-sm bg-[linear-gradient(#e4f0f5_55%,#a8743f_55%)] p-2 sm:p-3">
            <Tub state={state} />
            <Sink
              state={state}
              stains={state.tub.length > 0 ? bowls[state.tub[0]].stains : 0}
              onRub={(event) => {
                const last = rubbed.current;
                if (!last) {
                  return;
                }
                const distance =
                  last.distance + Math.hypot(event.clientX - last.x, event.clientY - last.y);
                rubbed.current = { x: event.clientX, y: event.clientY, distance };
                if (distance >= RUB_PER_SCRUB) {
                  rubbed.current.distance = 0;
                  act('scrub');
                }
              }}
              onRubStart={(event) => {
                rubbed.current = { x: event.clientX, y: event.clientY, distance: 0 };
              }}
              onRubEnd={() => {
                rubbed.current = null;
              }}
            />
            <Pile state={state} />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {DISH_ACTIONS.map((action, index) => (
              <button
                key={action}
                type="button"
                aria-disabled={!canDo(state, action)}
                {...pressHandlers(() => act(action))}
                className={`${BUTTON_CLASS} ${
                  action === 'deliver' ? 'bg-ui-accent' : 'bg-ui-paper'
                }`}
              >
                <kbd className="font-digits text-xs text-ui-ink/50 pointer-coarse:hidden">
                  {index + 1}
                </kbd>
                <span className="text-base sm:text-lg">
                  {action === 'deliver'
                    ? t('actions.deliver', { count: state.pile })
                    : t(`actions.${action}`)}
                </span>
              </button>
            ))}
          </div>
          <HostSays host="ramenChef" text={remarkOf(state, t)} />
        </>
      )}
    </ShiftFrame>
  );
}

// The tub of dirty bowls waiting, redder as it nears overflowing.
function Tub({ state }: { state: DishesState }) {
  const t = useTranslations('Ramen.dishes');
  const waiting = Math.max(0, state.tub.length - 1);
  const isFull = waiting >= TUB_LIMIT - 1;
  return (
    <div className="flex flex-col items-center">
      <div
        aria-hidden="true"
        className={`flex h-24 w-full flex-col-reverse items-center justify-start overflow-hidden rounded-b-2xl border-4 px-1 pb-1 ${
          isFull ? 'ui-shake border-ui-danger bg-ui-danger/15' : 'border-[#8a96a3] bg-[#b9c5d1]/60'
        }`}
      >
        {Array.from({ length: waiting }, (_, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: the tub only fills and empties.
            key={index}
            className="-mt-1 block h-2.5 w-4/5 shrink-0 rounded-b-full border-2 border-[#c8453a] bg-[#e6d9bf]"
          />
        ))}
      </div>
      <span className={`mt-1 text-center text-sm leading-tight ${isFull ? 'text-ui-danger' : ''}`}>
        {t('tub', { count: waiting, limit: TUB_LIMIT })}
      </span>
    </div>
  );
}

// Where the foam sits on the bowl, as it builds up with each scrub.
const FOAM = [
  [28, 38, 1.1],
  [62, 30, 0.9],
  [44, 62, 1],
  [70, 58, 0.8],
  [34, 50, 0.7],
  [56, 44, 1.2],
  [24, 64, 0.8],
  [74, 42, 0.7],
] as const;

// The washing-up corner: the tap over a sink of soapy water, the bowl in it, the sponge while
// scrubbing, the foam building up, the stream while rinsing, and sparkles once it is clean. The
// bowl can be scrubbed by rubbing it, too.
function Sink({
  state,
  stains,
  onRub,
  onRubStart,
  onRubEnd,
}: {
  state: DishesState;
  // How many stains the bowl in the sink had.
  stains: number;
  onRub: (event: { clientX: number; clientY: number }) => void;
  onRubStart: (event: { clientX: number; clientY: number }) => void;
  onRubEnd: () => void;
}) {
  const t = useTranslations('Ramen.dishes');
  const since = (kind: DishesMoment['kind']) => {
    const last = state.moments.filter((moment) => moment.kind === kind).at(-1);
    return last ? state.now - last.at : Number.POSITIVE_INFINITY;
  };
  const isScrubbing = since('scrubbed') < 400;
  const isRinsing = since('rinsed') < 700;
  const hasBowl = state.tub.length > 0 && state.carryingUntil === null;
  const foam =
    hasBowl && !state.isRinsed ? Math.min(FOAM.length, (stains - state.stainsLeft) * 3) : 0;
  const floats = state.moments.filter(
    (moment) =>
      ['broke', 'overflow', 'delivered', 'toppled'].includes(moment.kind) &&
      state.now - moment.at < MOMENT_MS,
  );
  const draw = useCallback(
    (drawing: CanvasRenderingContext2D, width: number, height: number) =>
      drawWashBowl(state.stainsLeft, state.isRinsed)(drawing, width, height),
    [state.stainsLeft, state.isRinsed],
  );
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative h-44 w-full touch-none overflow-hidden rounded-md shadow-[2px_3px_0_var(--ui-shadow)] sm:h-52"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          onRubStart(event);
        }}
        onPointerMove={onRub}
        onPointerUp={onRubEnd}
        onPointerCancel={onRubEnd}
      >
        <CanvasArt
          draw={drawSinkBackdrop}
          width={360}
          height={280}
          className="absolute inset-0 size-full"
        />
        {/* The stream from the tap, and its splashes. */}
        {isRinsing && (
          <>
            <span
              aria-hidden="true"
              className="ui-pour absolute top-[20%] left-1/2 h-[40%] w-3 -translate-x-1/2 rounded-b-full bg-[repeating-linear-gradient(#bfe6fb_0_0.5rem,#7fc2e8_0.5rem_0.75rem)] opacity-90"
            />
            {[-1, 1].map((side) => (
              <span
                key={side}
                aria-hidden="true"
                className="ui-bubble absolute top-[55%] size-2.5 rounded-full bg-[#9fd3f2]"
                style={{ left: `calc(50% + ${side * 2.2}rem)` }}
              />
            ))}
          </>
        )}
        {hasBowl ? (
          // The bowl in the sink, half in the water.
          <span className="absolute top-[62%] left-1/2 block -translate-x-1/2 -translate-y-1/2">
            <CanvasArt
              key={state.tub[0]}
              draw={draw}
              width={200}
              height={200}
              className="ui-seat-in size-24 drop-shadow-[0_4px_0_rgb(0_0_0/18%)] sm:size-28"
            />
            {FOAM.slice(0, foam).map(([left, top, size]) => (
              <span
                key={`${left}-${top}`}
                aria-hidden="true"
                className="ui-pop-in absolute rounded-full border-2 border-white/90 bg-white/75"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${size * 1.1}rem`,
                  height: `${size * 1.1}rem`,
                }}
              />
            ))}
            {state.isRinsed &&
              [
                [12, 18],
                [80, 26],
                [62, 78],
              ].map(([left, top], index) => (
                <span
                  key={`${left}-${top}`}
                  aria-hidden="true"
                  className="ui-twinkle absolute font-display text-xl text-[#ffe08a] drop-shadow-[0_0_4px_#fff]"
                  style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * 300}ms` }}
                >
                  ✦
                </span>
              ))}
            {isScrubbing && (
              <span className="ui-scrub absolute top-1/2 left-1/2 block">
                <CanvasArt
                  draw={drawSponge}
                  width={120}
                  height={90}
                  className="h-10 w-auto sm:h-12"
                />
              </span>
            )}
          </span>
        ) : (
          <span className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fbf6ea]/90 px-3 py-1 text-center text-sm">
            {state.carryingUntil !== null ? t('carrying') : t('empty')}
          </span>
        )}
        {/* What the bowl needs next. */}
        {hasBowl && (
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-[#fbf6ea]/95 px-2.5 py-0.5 text-sm whitespace-nowrap shadow-[1px_2px_0_var(--ui-shadow)]">
            {state.isRinsed
              ? t('rinsed')
              : state.stainsLeft > 0
                ? t('stains', { count: state.stainsLeft })
                : t('toRinse')}
          </span>
        )}
        {floats.map((moment) => (
          <span
            key={`${moment.kind}-${moment.at}`}
            aria-hidden="true"
            className={`ui-float-up pointer-events-none absolute top-[30%] left-1/2 font-display text-2xl whitespace-nowrap drop-shadow-[0_1px_0_#fbf6ea] ${
              moment.kind === 'delivered' ? 'text-[#3f8a6a]' : 'text-ui-danger'
            }`}
          >
            {moment.kind === 'delivered'
              ? t('moments.delivered', { count: moment.count ?? 0, bonus: moment.bonus ?? 0 })
              : t(`moments.${moment.kind as 'broke'}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

// The pile of clean bowls, swaying more the taller it grows, and what it would earn now.
function Pile({ state }: { state: DishesState }) {
  const t = useTranslations('Ramen.dishes');
  const sway = Math.max(0, state.pile - 3) * 1.6;
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-28 w-full items-end justify-center border-b-[6px] border-[#8a929b] sm:h-36">
        <div
          aria-hidden="true"
          className={`flex flex-col-reverse items-center ${state.pile > 3 ? 'ui-wobble' : ''}`}
          style={{ '--wobble': `${sway}deg` } as React.CSSProperties}
        >
          {Array.from({ length: Math.min(state.pile, 12) }, (_, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: the pile only grows, or falls whole.
              key={index}
              className="ui-seat-in -mt-1 block h-3 w-14 rounded-b-full border-2 border-[#c8453a] bg-[#fbf6ea] sm:w-16"
            />
          ))}
        </div>
      </div>
      <span className="mt-1 text-center text-sm leading-tight">
        {state.pile > 0
          ? t('pile', { count: state.pile, bonus: pileBonus(state.pile) })
          : t('pileEmpty')}
      </span>
    </div>
  );
}

// What Yuzu says: about what just happened, else about the tub or the pile.
function remarkOf(state: DishesState, t: ReturnType<typeof useTranslations<'Ramen.dishes'>>) {
  const last = state.moments.at(-1);
  const recent =
    last && state.now - last.at < REMARK_MS && last.kind !== 'scrubbed' && last.kind !== 'rinsed'
      ? last
      : null;
  if (recent?.kind === 'toppled') {
    return t('yuzu.toppled', { count: recent.count ?? 0 });
  }
  if (recent?.kind === 'delivered') {
    return t('yuzu.delivered', { count: recent.count ?? 0, bonus: recent.bonus ?? 0 });
  }
  if (recent?.kind === 'broke' || recent?.kind === 'overflow') {
    return t(`yuzu.${recent.kind}`);
  }
  if (state.carryingUntil !== null && state.carryingUntil - state.now < CARRY_MS) {
    return t('yuzu.carrying');
  }
  if (state.tub.length > TUB_LIMIT - 1) {
    return t('yuzu.tubFull');
  }
  if (state.pile >= 6) {
    return t('yuzu.tall');
  }
  return state.banked === 0 && state.pile === 0 ? t('yuzu.start') : t('yuzu.calm');
}
