'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  canTouchTable,
  dishInHand,
  type Guest,
  SERVICE_MISTAKE_LIMIT,
  SERVICE_TABLES,
  type ServiceDish,
  type ServiceMoment,
  type ServiceState,
  serviceGuests,
  servicePoints,
  simulateService,
} from '@/game/quests/shifts/ramen-service';
import type { ShiftAction } from '@/game/quests/shifts/shifts';
import { drawServiceDish, drawServiceTable } from '../art/ramen';
import { SellerPortrait } from '../shop/seller-portrait';
import { digitKeys, HostSays, ScoreLine, type ShiftEnd, ShiftFrame, useShift } from './shift';

// How long a moment, such as a tip, stays on screen.
const MOMENT_MS = 900;
// What Yuzu says stays a little longer.
const REMARK_MS = 1600;

// A bowl, drawn once on its own canvas.
function DishIcon({ dish, className }: { dish: ServiceDish; className: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const drawing = canvas.current?.getContext('2d');
    if (!drawing || !canvas.current) {
      return;
    }
    drawing.clearRect(0, 0, canvas.current.width, canvas.current.height);
    drawServiceDish(dish)(drawing, canvas.current.width, canvas.current.height);
  }, [dish]);
  return (
    // A picture beside its name, so hidden from screen readers.
    <span aria-hidden="true" className="contents">
      <canvas ref={canvas} width={120} height={100} className={className} />
    </span>
  );
}

// A table of the dining room, drawn once.
function TableDrawing() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const drawing = canvas.current?.getContext('2d');
    if (drawing && canvas.current) {
      drawServiceTable(drawing, canvas.current.width, canvas.current.height);
    }
  }, []);
  return (
    <span aria-hidden="true" className="contents">
      <canvas ref={canvas} width={200} height={110} className="block h-auto w-full" />
    </span>
  );
}

// Waiting tables at Ramen Yuzu: the kitchen's pass at the top, the four tables and their guests
// below, and Yuzu cheering on. The scene plays the same simulation as the server, frame by frame.
export function ServiceShift({ onDone }: { onDone: (end: ShiftEnd) => void }) {
  const tService = useTranslations('Ramen.service');
  const box = useRef<HTMLDivElement>(null);
  const simulate = useCallback(
    (seed: number, presses: readonly ShiftAction[], until: number) =>
      simulateService(seed, presses, until),
    [],
  );
  const { phase, state, start, press, showScore, secondsLeft } = useShift(
    'service',
    simulate,
    servicePoints,
  );
  const seed = phase.step === 'playing' ? phase.seed : 0;
  const guests = useMemo(() => serviceGuests(seed), [seed]);
  const serve = (table: number) => press(table, (now) => canTouchTable(now, table));

  return (
    <ShiftFrame
      host="ramenChef"
      job="service"
      phase={phase}
      onShowScore={showScore}
      secondsLeft={secondsLeft}
      howTo={tService('howTo')}
      onStart={start}
      onDone={onDone}
      onKeyDown={digitKeys(phase.step === 'playing', SERVICE_TABLES, serve)}
      box={box}
    >
      {state && (
        <>
          <ScoreLine
            points={servicePoints(state)}
            mistakes={state.mistakes}
            limit={SERVICE_MISTAKE_LIMIT}
          />
          <Pass state={state} />
          <DiningRoom state={state} guests={guests} onServe={serve} />
          <YuzuRemark state={state} guests={guests} />
        </>
      )}
    </ShiftFrame>
  );
}

// The kitchen's pass: the bowl in hand first and larger, then the others, those still cooking
// greyed under their steam.
function Pass({ state }: { state: ServiceState }) {
  const tService = useTranslations('Ramen.service');
  const tDishes = useTranslations('Ramen.shift.dishes');
  const hand = dishInHand(state);
  const others = state.pass.filter((item) => item !== hand).slice(0, 4);
  return (
    <div className="mt-2 flex items-end gap-2 rounded-sm bg-[#5e3a22] px-3 pt-2 pb-1.5 text-[#fbf6ea] shadow-[inset_0_-6px_0_rgb(0_0_0/18%)]">
      <div className="flex w-24 shrink-0 flex-col items-center">
        {hand ? (
          <>
            <DishIcon
              dish={hand.dish}
              className="ui-in-hand h-14 w-auto drop-shadow-[0_0_8px_#ffe08a]"
            />
            <span className="text-sm font-semibold leading-tight">{tDishes(hand.dish)}</span>
            <span className="text-xs text-[#ffe08a]">{tService('inHand')}</span>
          </>
        ) : (
          <span className="flex h-14 items-center text-sm text-[#fbf6ea]/70">
            {tService('cooking')}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-end gap-1.5 overflow-hidden border-l-2 border-dashed border-[#fbf6ea]/25 pl-2">
        {others.map((item, index) => (
          <DishIcon
            // biome-ignore lint/suspicious/noArrayIndexKey: the pass is a queue, shown in order.
            key={index}
            dish={item.dish}
            className={`h-9 w-auto ${item.readyAt > state.now ? 'opacity-40 grayscale' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

const MOMENT_STYLES: Record<ServiceMoment['kind'], string> = {
  served: 'text-[#3f8a6a]',
  cleared: 'text-[#4f7fb0]',
  tip: 'text-[#c8892a]',
  angry: 'text-ui-danger',
  wrong: 'text-ui-danger',
};

// The four tables, each a button: the guest sitting there, their order with a patience gauge,
// and what just happened, rising over the table.
function DiningRoom({
  state,
  guests,
  onServe,
}: {
  state: ServiceState;
  guests: Guest[];
  onServe: (table: number) => void;
}) {
  const tService = useTranslations('Ramen.service');
  const tShift = useTranslations('Ramen.shift');
  const tDishes = useTranslations('Ramen.shift.dishes');
  return (
    <div className="mt-2 rounded-sm bg-[linear-gradient(#efe2c8_70%,#b07a48_70%)] p-1.5 sm:p-2.5">
      {/* The guests waiting at the door for a table, the first of them on the left. */}
      <div className="flex h-9 items-center gap-1" aria-live="polite">
        <span className="shrink-0 text-sm text-ui-ink/70">
          {tService('queue', { count: state.queue.length })}
        </span>
        {state.queue.slice(0, 6).map((guest) => (
          <span
            key={guest}
            className="ui-seat-in block size-8 shrink-0 overflow-hidden rounded-full border-2 border-[#fbf6ea] bg-[#e7d9bc]"
          >
            <SellerPortrait stock={guests[guest].look} />
          </span>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        {state.tables.map((seat, table) => {
          const guest = seat ? guests[seat.guest] : null;
          const isWaiting = seat?.outcome === 'waiting';
          const isDirty = seat?.outcome === 'dirty';
          const patienceLeft =
            seat && guest && isWaiting
              ? Math.max(0, 1 - (state.now - seat.seatedAt) / guest.patience)
              : 0;
          const moments = state.moments.filter(
            (moment) => moment.table === table && state.now - moment.at < MOMENT_MS,
          );
          const isShaken = moments.some(({ kind }) => kind === 'angry' || kind === 'wrong');
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: the tables never move.
              key={table}
              type="button"
              aria-label={
                guest && isWaiting
                  ? tService('tableWithOrder', { number: table + 1, dish: tDishes(guest.dish) })
                  : isDirty
                    ? tService('tableToClear', { number: table + 1 })
                    : tShift('table', { number: table + 1 })
              }
              onPointerDown={(event) => {
                // A tap answers at once, rather than on the finger's way up.
                event.preventDefault();
                onServe(table);
              }}
              onClick={(event) => {
                // Only the keyboard's own presses come through here: a tap already answered.
                if (event.detail === 0) {
                  onServe(table);
                }
              }}
              className={`relative flex min-h-44 cursor-pointer touch-manipulation flex-col items-center justify-end rounded-sm outline-none select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp sm:min-h-52 ${
                isShaken ? 'ui-shake' : ''
              }`}
            >
              {/* The order and the guest's patience, or a sponge over a table to clear. */}
              {guest && isWaiting && (
                <span className="ui-pop-in relative mb-1 flex flex-col items-center rounded-2xl bg-[#fbf6ea] px-1.5 pt-1 pb-1.5 shadow-[2px_3px_0_var(--ui-shadow)]">
                  <DishIcon dish={guest.dish} className="h-8 w-auto sm:h-10" />
                  <span className="text-xs leading-tight sm:text-sm">{tDishes(guest.dish)}</span>
                  <span className="mt-1 block h-1.5 w-12 overflow-hidden rounded-full bg-ui-ink/10 sm:w-16">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${patienceLeft * 100}%`,
                        backgroundColor:
                          patienceLeft > 0.5
                            ? '#3f8a6a'
                            : patienceLeft > 0.25
                              ? '#e8a33e'
                              : '#c8453a',
                      }}
                    />
                  </span>
                </span>
              )}
              {isDirty && (
                <span className="ui-bob mb-1 rounded-2xl bg-[#d9ebf7] px-2 py-1 text-xs leading-tight font-semibold text-[#2f5d86] shadow-[2px_3px_0_var(--ui-shadow)] sm:text-sm">
                  {tService('toClear')}
                </span>
              )}
              {/* The guest, sitting: happy while eating, red while storming out. */}
              {guest && seat && !isDirty ? (
                <span
                  key={seat.guest}
                  className={`ui-seat-in relative block size-14 overflow-hidden rounded-full border-3 bg-[#e7d9bc] sm:size-16 ${
                    seat.outcome === 'angry'
                      ? 'border-ui-danger opacity-70'
                      : seat.outcome === 'eating'
                        ? 'border-[#e8b33e]'
                        : 'border-[#fbf6ea]'
                  }`}
                >
                  <SellerPortrait stock={guest.look} />
                </span>
              ) : (
                <span className="block size-14 sm:size-16" />
              )}
              {/* The table in front of the guest, its number, and the bowl while eaten, or left
                empty. */}
              <span className="relative -mt-6 block w-full sm:-mt-7">
                <TableDrawing />
                {guest && (seat?.outcome === 'eating' || isDirty) ? (
                  <DishIcon
                    dish={guest.dish}
                    className={`absolute -top-3 left-1/2 h-9 w-auto -translate-x-1/2 ${
                      isDirty ? 'opacity-60 grayscale' : ''
                    }`}
                  />
                ) : null}
                <span className="absolute right-0 bottom-0 left-0 text-center font-digits text-xs font-bold text-ui-ink/60">
                  {table + 1}
                </span>
              </span>
              {moments.map((moment) => (
                <span
                  key={`${moment.kind}-${moment.at}`}
                  aria-hidden="true"
                  className={`ui-float-up pointer-events-none absolute top-6 left-1/2 font-display text-lg whitespace-nowrap drop-shadow-[0_1px_0_#fbf6ea] ${MOMENT_STYLES[moment.kind]}`}
                  style={{ top: moment.kind === 'tip' ? '0.25rem' : '2rem' }}
                >
                  {tService(`moments.${moment.kind}`)}
                </span>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Yuzu, at the bottom, cheering on or wincing at what just happened, or warning of an impatient
// table.
function YuzuRemark({ state, guests }: { state: ServiceState; guests: Guest[] }) {
  const tService = useTranslations('Ramen.service');
  const last = state.moments.at(-1);
  const recent = last && state.now - last.at < REMARK_MS ? last : null;
  const hurried = state.tables.findIndex(
    (seat) =>
      seat?.outcome === 'waiting' && state.now - seat.seatedAt > guests[seat.guest].patience * 0.7,
  );
  const dirty = state.tables.findIndex((seat) => seat?.outcome === 'dirty');
  const remark =
    recent && recent.kind !== 'cleared'
      ? recent.kind === 'angry'
        ? tService('yuzu.angry')
        : recent.kind === 'wrong'
          ? tService('yuzu.wrong')
          : state.streak >= 3
            ? tService('yuzu.combo', { count: state.streak })
            : recent.kind === 'tip'
              ? tService('yuzu.quick')
              : tService('yuzu.served')
      : hurried >= 0
        ? tService('yuzu.hurry', { number: hurried + 1 })
        : dirty >= 0 && state.queue.length > 0
          ? tService('yuzu.clear', { number: dirty + 1 })
          : state.served === 0 && state.mistakes === 0
            ? tService('yuzu.start')
            : tService('yuzu.calm');
  return <HostSays host="ramenChef" text={remark} />;
}
