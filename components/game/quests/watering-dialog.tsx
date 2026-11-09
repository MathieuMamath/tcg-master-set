'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { Wallet } from '@/game/cards/shop-dialogue';
import {
  BEDS,
  type Beds,
  bloomingBeds,
  isBlooming,
  isGardenWatered,
  POURS_PER_BED,
  pour,
  thirstyBeds,
  WATERING_REWARD,
} from '@/game/quests/park-watering';
import {
  drawFlowerBed,
  drawGardenScenery,
  drawWateringCan,
  GARDEN_SCENERY_SIZE,
} from '../art/park-games';
import { focusFirstChoice, moveThroughChoices, openDialog } from '../menu-focus';
import { usePlayerName } from '../player-name';
import { CanvasArt, HostSays } from '../shifts/shift';
import { CHOICE_CLASS, TornPaper } from '../shop/shop-dialog';

const BED_COLORS = ['#e05a7e', '#f0c43a', '#9a6ad6', '#f08a3a', '#e8e2f0'] as const;
// How long the water pours after a pouring, and the flowers sparkle once a bed blooms.
const POURING_MS = 450;
const BLOOM_SPARKLE_MS = 1600;

// The garden's scenery, drawn once when first needed, then copied onto the canvas that shows it.
let gardenScenery: HTMLCanvasElement | null = null;
function drawGarden(drawing: CanvasRenderingContext2D, width: number, height: number) {
  gardenScenery ??= drawGardenScenery();
  drawing.drawImage(gardenScenery, 0, 0, width, height);
}

// Each bed's drawing, thirsty and in flower, made once.
const BED_DRAWINGS = BED_COLORS.map((color) => ({
  thirsty: (drawing: CanvasRenderingContext2D, width: number, height: number) =>
    drawFlowerBed(drawing, width / 2, height, width * 0.92, 'thirsty', color),
  blooming: (drawing: CanvasRenderingContext2D, width: number, height: number) =>
    drawFlowerBed(drawing, width / 2, height, width * 0.92, 'blooming', color),
}));

type Step =
  | { kind: 'starting' }
  | { kind: 'watering' }
  | { kind: 'paying' }
  | { kind: 'done'; isRewarded: boolean }
  | { kind: 'alreadyDone' }
  | { kind: 'error' };

type Props = {
  // The coins after the watering, for the counters and the save notice.
  onWatered: (wallet: Wallet) => void;
  onClose: () => void;
};

// Watering Pépin's flower beds: a calm chore, once a day, for a fixed reward. Each bed takes a few
// pourings, by a click, a touch or the keys 1 to 5, and blooms. Once all are in flower, the server
// pays.
export function WateringDialog({ onWatered, onClose }: Props) {
  const t = useTranslations('Garden.watering');
  const playerName = usePlayerName();
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>({ kind: 'starting' });
  const [beds, setBeds] = useState<Beds>(thirstyBeds);
  const [pouring, setPouring] = useState<number | null>(null);
  // The beds that just bloomed, sparkling for a moment.
  const [bloomed, setBloomed] = useState<boolean[]>(() =>
    Array.from({ length: BEDS }, () => false),
  );

  useEffect(() => {
    openDialog(dialog.current);
    fetch('/api/quests/watering/start', { method: 'POST' })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(({ hasStarted }: { hasStarted: boolean }) => {
        if (!hasStarted) {
          // Watered already today: the beds are in flower, and nothing is left to do.
          setBeds(bloomingBeds());
        }
        setStep(hasStarted ? { kind: 'watering' } : { kind: 'alreadyDone' });
      })
      .catch(() => setStep({ kind: 'error' }));
  }, []);

  // Each new step puts the focus on its first choice, once it is drawn.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new step is what moves the focus.
  useEffect(() => {
    const frame = requestAnimationFrame(() => dialog.current && focusFirstChoice(dialog.current));
    return () => cancelAnimationFrame(frame);
  }, [step.kind]);

  useEffect(() => {
    if (pouring === null) {
      return;
    }
    const timer = window.setTimeout(() => setPouring(null), POURING_MS);
    return () => window.clearTimeout(timer);
  }, [pouring]);

  // Once every bed blooms, the server pays.
  useEffect(() => {
    if (step.kind !== 'watering' || !isGardenWatered(beds)) {
      return;
    }
    setStep({ kind: 'paying' });
    fetch('/api/quests/watering/finish', { method: 'POST' })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(({ isRewarded, wallet }: { isRewarded: boolean; wallet: Wallet }) => {
        onWatered(wallet);
        setStep({ kind: 'done', isRewarded });
      })
      .catch(() => setStep({ kind: 'error' }));
  }, [beds, step.kind, onWatered]);

  const water = (bed: number) => {
    if (step.kind !== 'watering' || isBlooming(beds[bed])) {
      return;
    }
    setBeds((current) => pour(current, bed));
    setPouring(bed);
    if (beds[bed] + 1 >= POURS_PER_BED) {
      setBloomed((current) => current.map((isOn, index) => isOn || index === bed));
      window.setTimeout(
        () => setBloomed((current) => current.map((isOn, index) => isOn && index !== bed)),
        BLOOM_SPARKLE_MS,
      );
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code)?.[1];
    if (step.kind === 'watering' && digit && Number(digit) <= BEDS) {
      event.preventDefault();
      if (!event.repeat) {
        water(Number(digit) - 1);
      }
      return;
    }
    moveThroughChoices(event);
  };

  const remark =
    step.kind === 'alreadyDone'
      ? t('alreadyDone', { name: playerName })
      : step.kind === 'done'
        ? step.isRewarded
          ? t('thanks', { coins: WATERING_REWARD })
          : t('notPaid')
        : step.kind === 'error'
          ? t('error')
          : beds.some((pourings) => pourings > 0)
            ? t('going')
            : t('start');

  return (
    <dialog
      ref={dialog}
      aria-labelledby="watering-title"
      onClose={onClose}
      onKeyDown={onKeyDown}
      className="ui-pop-in m-auto w-[min(34rem,calc(100%-1rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="px-3 pt-4 pb-4 sm:px-5">
        <h2 id="watering-title" className="font-display text-xl">
          {t('title')}
        </h2>
        <p className="mt-1 text-ui-ink/80">{t('howTo', { coins: WATERING_REWARD })}</p>
        {/* Pépin's garden: its scenery behind, the five beds on the lawn, and the can over the bed
            being watered. */}
        <div className="relative mt-3 overflow-hidden rounded-sm bg-[#8cbf5f]">
          <CanvasArt
            draw={drawGarden}
            width={GARDEN_SCENERY_SIZE.width}
            height={GARDEN_SCENERY_SIZE.height}
            className="absolute inset-0 size-full object-cover object-bottom"
          />
          <div className="relative grid grid-cols-5 gap-1 px-2 pt-14 pb-2 sm:pt-20">
            {beds.map((pourings, bed) => {
              const isInFlower = isBlooming(pourings);
              return (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: the beds never move.
                  key={bed}
                  type="button"
                  aria-label={t('bed', {
                    number: bed + 1,
                    state: isInFlower ? 'blooming' : 'thirsty',
                  })}
                  aria-disabled={step.kind !== 'watering' || isInFlower}
                  onClick={() => water(bed)}
                  className="relative flex cursor-pointer touch-manipulation flex-col items-center rounded-sm outline-none select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp"
                >
                  {/* Its number and the drops still to pour, on a paper tag. */}
                  <span className="mb-1 flex items-center gap-1 rounded-full bg-[#fbf6ea]/90 px-1.5 py-0.5 shadow-[1px_2px_0_var(--ui-shadow)]">
                    <kbd className="font-digits text-xs text-ui-ink/60 pointer-coarse:hidden">
                      {bed + 1}
                    </kbd>
                    <span aria-hidden="true" className="flex gap-0.5">
                      {Array.from({ length: POURS_PER_BED }, (_, drop) => drop).map((drop) => (
                        <span
                          key={drop}
                          className={`h-2.5 w-2 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] ${
                            drop < pourings ? 'bg-[#3c78b4]' : 'bg-ui-ink/15'
                          }`}
                        />
                      ))}
                    </span>
                  </span>
                  {pouring === bed && (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute -top-12 left-1/2 w-14 -translate-x-1/4 -rotate-20 sm:-top-14 sm:w-16"
                      >
                        <CanvasArt
                          draw={drawWateringCan}
                          width={120}
                          height={96}
                          className="h-auto w-full"
                        />
                      </span>
                      <span
                        aria-hidden="true"
                        className="ui-pour absolute top-1 left-[38%] h-14 w-2 rounded-full bg-[repeating-linear-gradient(#7fb3d9_0_0.4rem,transparent_0.4rem_0.75rem)]"
                      />
                    </>
                  )}
                  {bloomed[bed] && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-6 flex justify-around"
                    >
                      {['0ms', '200ms', '400ms'].map((delay) => (
                        <span
                          key={delay}
                          className="ui-twinkle text-lg text-[#f6d24a]"
                          style={{ animationDelay: delay }}
                        >
                          ✦
                        </span>
                      ))}
                    </span>
                  )}
                  <span key={isInFlower ? 'flower' : 'thirsty'} className="ui-pop-in block w-full">
                    <CanvasArt
                      draw={BED_DRAWINGS[bed][isInFlower ? 'blooming' : 'thirsty']}
                      width={120}
                      height={120}
                      className="h-20 w-full object-contain sm:h-24"
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <HostSays host="gardener" text={remark} />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className={`${CHOICE_CLASS} ${step.kind === 'done' ? 'bg-ui-accent!' : ''}`}
          >
            {step.kind === 'done' || step.kind === 'alreadyDone' || step.kind === 'error'
              ? t('close')
              : t('stop')}
          </button>
        </div>
      </TornPaper>
    </dialog>
  );
}
