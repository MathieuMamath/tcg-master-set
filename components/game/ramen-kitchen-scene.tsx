'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';
import {
  isBowlInZone,
  KITCHEN_INGREDIENTS,
  KITCHEN_MISTAKE_LIMIT,
  type KitchenIngredient,
  type KitchenOrder,
  type KitchenState,
  kitchenOrders,
  kitchenPoints,
  simulateKitchen,
} from '@/game/ramen-kitchen';
import { drawBrothBowl, drawIngredient } from './paper-art';
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

// The drawings of the ingredients, made once.
const INGREDIENT_DRAWINGS = Object.fromEntries(
  KITCHEN_INGREDIENTS.map((ingredient) => [ingredient, drawIngredient(ingredient)]),
) as Record<KitchenIngredient, ReturnType<typeof drawIngredient>>;

// Helping in Ramen Yuzu's kitchen: the bowl rides the belt under the bins, its ticket above.
export function KitchenShift({ onDone }: { onDone: (end: ShiftEnd) => void }) {
  const t = useTranslations('Ramen.kitchen');
  const tIngredients = useTranslations('Ramen.shift.ingredients');
  const box = useRef<HTMLDivElement>(null);
  const simulate = useCallback(simulateKitchen, []);
  const { phase, state, start, press, secondsLeft } = useShift('kitchen', simulate, kitchenPoints);
  const isPlaying = phase.step === 'playing';
  const seed = phase.step === 'playing' ? phase.seed : 0;
  const orders = useMemo(() => kitchenOrders(seed), [seed]);
  const add = (choice: number) => press(choice, (now) => isBowlInZone(now));

  return (
    <ShiftFrame
      host="ramenChef"
      job="kitchen"
      phase={phase}
      secondsLeft={secondsLeft}
      howTo={t('howTo')}
      onStart={start}
      onDone={onDone}
      onKeyDown={digitKeys(isPlaying, KITCHEN_INGREDIENTS.length, add)}
      box={box}
    >
      {state && (
        <>
          <ScoreLine
            points={kitchenPoints(state)}
            mistakes={state.mistakes}
            limit={KITCHEN_MISTAKE_LIMIT}
          />
          <Ticket state={state} order={orders[state.order]} />
          <Belt state={state} order={orders[state.order]} />
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {KITCHEN_INGREDIENTS.map((ingredient, index) => (
              <button
                key={ingredient}
                type="button"
                aria-disabled={!isBowlInZone(state)}
                {...pressHandlers(() => add(index))}
                className="flex cursor-pointer touch-manipulation flex-col items-center rounded-sm bg-[#8a96a3] px-1 pt-1 pb-1.5 text-[#fbf6ea] shadow-[2px_3px_0_var(--ui-shadow)] outline-none select-none active:translate-y-0.5 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-disabled:opacity-45"
              >
                <span className="grid w-full place-items-center rounded-sm bg-[#fbf6ea]">
                  <CanvasArt
                    draw={INGREDIENT_DRAWINGS[ingredient]}
                    width={120}
                    height={120}
                    className="size-12"
                  />
                </span>
                <span className="mt-0.5 text-sm leading-tight">
                  <kbd className="font-digits text-xs opacity-70 pointer-coarse:hidden">
                    {index + 1}{' '}
                  </kbd>
                  {tIngredients(ingredient)}
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

// The ticket over the belt: the bowl's ingredients, ticked off as they go in.
function Ticket({ state, order }: { state: KitchenState; order: KitchenOrder }) {
  const t = useTranslations('Ramen.kitchen');
  const tIngredients = useTranslations('Ramen.shift.ingredients');
  return (
    <div className="mx-auto mt-2 flex w-fit -rotate-1 items-center gap-2 bg-[#fbf6ea] px-3 py-1.5 shadow-[2px_3px_0_var(--ui-shadow)]">
      <span className="font-display text-ui-stamp">{t('ticket')}</span>
      {order.ingredients.map((ingredient) => {
        const isAdded = state.added.includes(ingredient);
        return (
          <span
            key={ingredient}
            className={`relative flex flex-col items-center ${isAdded ? 'opacity-40' : ''}`}
          >
            <CanvasArt
              draw={INGREDIENT_DRAWINGS[ingredient]}
              width={120}
              height={120}
              className="size-9"
            />
            <span className="text-xs leading-tight">{tIngredients(ingredient)}</span>
            {isAdded && (
              <span
                aria-hidden="true"
                className="absolute -top-1 right-0 font-display text-[#3f8a6a]"
              >
                ✓
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// The belt: the bowl crossing the zone under the bins, its ingredients in it, and the time it has
// left as how far it has gone.
function Belt({ state, order }: { state: KitchenState; order: KitchenOrder }) {
  const t = useTranslations('Ramen.kitchen');
  const progress = isBowlInZone(state)
    ? Math.min(1, (state.now - state.enteredAt) / order.window)
    : 0;
  const floats = state.moments.filter(
    (moment) => moment.kind !== 'added' && state.now - moment.at < MOMENT_MS,
  );
  return (
    <div className="relative mt-3 h-28 overflow-hidden rounded-sm bg-[#d9cdb5] sm:h-32">
      {/* The zone under the bins, and the edge the bowl falls off. */}
      <span className="absolute inset-y-0 right-3 left-3 border-x-4 border-dashed border-ui-ink/15" />
      <span className="ui-belt absolute inset-x-0 bottom-0 h-6 bg-[repeating-linear-gradient(90deg,#3a3845_0_1rem,#4f4d5c_1rem_2rem)]" />
      <div
        className={`absolute bottom-4 ${isBowlInZone(state) ? '' : 'opacity-0'}`}
        style={{ left: `calc(${4 + progress * 76}% )` }}
      >
        <div className="relative">
          <CanvasArt
            draw={drawBrothBowl}
            width={120}
            height={100}
            className="h-16 w-auto sm:h-20"
          />
          <div className="absolute -inset-x-3 -top-5 flex justify-center -space-x-1.5">
            {state.added.map((ingredient) => (
              <CanvasArt
                key={ingredient}
                draw={INGREDIENT_DRAWINGS[ingredient]}
                width={120}
                height={120}
                className="ui-seat-in size-8 drop-shadow-[0_2px_0_rgb(0_0_0/15%)] sm:size-9"
              />
            ))}
          </div>
        </div>
      </div>
      <span
        className={`absolute top-1 right-2 text-sm ${progress > 0.7 ? 'text-ui-danger' : 'text-ui-ink/50'}`}
      >
        {t('edge')}
      </span>
      {floats.map((moment) => (
        <span
          key={`${moment.kind}-${moment.at}`}
          aria-hidden="true"
          className={`ui-float-up pointer-events-none absolute top-6 left-1/2 font-display text-xl whitespace-nowrap drop-shadow-[0_1px_0_#fbf6ea] ${
            moment.kind === 'served' || moment.kind === 'quick'
              ? 'text-[#3f8a6a]'
              : 'text-ui-danger'
          }`}
          style={{ top: moment.kind === 'quick' ? '0.25rem' : '1.75rem' }}
        >
          {t(`moments.${moment.kind as 'served'}`)}
        </span>
      ))}
    </div>
  );
}

function remarkOf(state: KitchenState, t: ReturnType<typeof useTranslations<'Ramen.kitchen'>>) {
  const last = state.moments.filter((moment) => moment.kind !== 'added').at(-1);
  const recent = last && state.now - last.at < REMARK_MS ? last : null;
  if (recent?.kind === 'spoiled' || recent?.kind === 'dropped') {
    return t(`yuzu.${recent.kind}`);
  }
  if (recent && state.streak >= 3) {
    return t('yuzu.combo', { count: state.streak });
  }
  if (recent?.kind === 'quick') {
    return t('yuzu.quick');
  }
  if (recent?.kind === 'served') {
    return t('yuzu.served');
  }
  return state.served === 0 && state.mistakes === 0 ? t('yuzu.start') : t('yuzu.calm');
}
