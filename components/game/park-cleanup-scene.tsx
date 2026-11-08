'use client';

import { useTranslations } from 'next-intl';
import { type CSSProperties, useCallback, useMemo, useRef } from 'react';
import {
  BINS,
  type Bin,
  CLEANUP_MISTAKE_LIMIT,
  type CleanupState,
  canSort,
  cleanupPoints,
  inReach,
  type Litter,
  parkLitter,
  REACH_AFTER_MS,
  simulateCleanup,
} from '@/game/park-cleanup';
import {
  drawBinCart,
  drawLitter,
  drawParkPathScenery,
  drawPip,
  drawSortingBin,
  type LitterDrawing,
  PATH_SCENERY_SIZE,
} from './paper-art';
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
// Where Pip walks on the path, in percent from the left, and how long a piece left behind stays
// in sight.
const PIP_X = 42;
const BEHIND_MS = 600;
// How long the park's scenery takes to go by once, as Pip walks.
const SCROLL_TIME = { '--scroll-time': '9s' } as CSSProperties;

// The park's scenery, drawn once when first needed, then copied onto each canvas that shows it.
let pathScenery: HTMLCanvasElement | null = null;
function drawPathScenery(drawing: CanvasRenderingContext2D, width: number, height: number) {
  pathScenery ??= drawParkPathScenery();
  drawing.drawImage(pathScenery, 0, 0, width, height);
}

const LOOKS: readonly LitterDrawing[] = [
  'newspaper',
  'crumpledPaper',
  'can',
  'plasticBottle',
  'jar',
  'glassBottle',
];
// The drawings, made once.
const LITTER_DRAWINGS = Object.fromEntries(LOOKS.map((look) => [look, drawLitter(look)])) as Record<
  LitterDrawing,
  ReturnType<typeof drawLitter>
>;
const BIN_DRAWINGS = Object.fromEntries(BINS.map((bin) => [bin, drawSortingBin(bin)])) as Record<
  Bin,
  ReturnType<typeof drawSortingBin>
>;

// The great clean-up at Linden Park: Pip walks along the path with the cart of bins behind, and the
// litter comes their way. The keys 1 to 3, or the bins, sort the piece within reach.
export function CleanupShift({ onDone }: { onDone: (end: ShiftEnd) => void }) {
  const t = useTranslations('Garden.cleanup');
  const box = useRef<HTMLDivElement>(null);
  const simulate = useCallback(simulateCleanup, []);
  const { phase, state, start, press, secondsLeft } = useShift('cleanup', simulate, cleanupPoints);
  const isPlaying = phase.step === 'playing';
  const seed = phase.step === 'playing' ? phase.seed : 0;
  const litter = useMemo(() => parkLitter(seed), [seed]);
  const sort = (bin: number) => press(bin, (now) => canSort(now, litter));

  return (
    <ShiftFrame
      host="gardener"
      job="cleanup"
      phase={phase}
      secondsLeft={secondsLeft}
      howTo={t('howTo')}
      onStart={start}
      onDone={onDone}
      onKeyDown={digitKeys(isPlaying, BINS.length, sort)}
      box={box}
    >
      {state && (
        <>
          <ScoreLine
            points={cleanupPoints(state)}
            mistakes={state.mistakes}
            limit={CLEANUP_MISTAKE_LIMIT}
          />
          <Path state={state} litter={litter} />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {BINS.map((bin, index) => (
              <button
                key={bin}
                type="button"
                {...pressHandlers(() => sort(index))}
                className="flex cursor-pointer touch-manipulation flex-col items-center rounded-sm bg-[#e8f0dc] px-1 pt-1 pb-1.5 shadow-[2px_3px_0_var(--ui-shadow)] outline-none select-none active:translate-y-0.5 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp"
              >
                <CanvasArt
                  draw={BIN_DRAWINGS[bin]}
                  width={90}
                  height={100}
                  className="h-12 w-auto"
                />
                <span className="mt-0.5 text-sm leading-tight">
                  <kbd className="font-digits text-xs opacity-70 pointer-coarse:hidden">
                    {index + 1}{' '}
                  </kbd>
                  {t(`bins.${bin}`)}
                </span>
              </button>
            ))}
          </div>
          <HostSays host="gardener" text={remarkOf(state, t)} />
        </>
      )}
    </ShiftFrame>
  );
}

// The path: the park behind, the ground moving under Pip's steps, the cart of bins behind him, the
// litter coming from the right, and the circle of his reach, lit when a piece is in it.
function Path({ state, litter }: { state: CleanupState; litter: readonly Litter[] }) {
  const t = useTranslations('Garden.cleanup');
  const reaching = inReach(state, litter);
  const handled = new Set(
    state.moments
      .filter((moment) => moment.kind === 'sorted' || moment.kind === 'wrongBin')
      .map((moment) => moment.litter),
  );
  // The pieces on their way, within reach, or just left behind.
  const coming = litter
    .map((piece, index) => ({ piece, index }))
    .filter(
      ({ piece, index }) =>
        !handled.has(index) &&
        state.now >= piece.at - piece.travel &&
        state.now < piece.at + REACH_AFTER_MS + BEHIND_MS,
    );
  const sortedNow = state.moments.filter(
    (moment) =>
      (moment.kind === 'sorted' || moment.kind === 'wrongBin') && state.now - moment.at < 500,
  );
  const floats = state.moments.filter((moment) => state.now - moment.at < MOMENT_MS);

  return (
    <div
      role="img"
      aria-label={
        reaching === null ? t('path') : t('reaching', { look: t(`looks.${litter[reaching].look}`) })
      }
      className="relative mt-2 h-56 overflow-hidden rounded-sm bg-[#dcc89a] sm:h-64"
    >
      {/* The park going by as Pip walks: two copies of its scenery side by side, sliding along. */}
      <span aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <span className="ui-scroll-half flex h-full w-max" style={SCROLL_TIME}>
          {[0, 1].map((copy) => (
            <CanvasArt
              key={copy}
              draw={drawPathScenery}
              width={PATH_SCENERY_SIZE.width}
              height={PATH_SCENERY_SIZE.height}
              className="block h-full w-auto max-w-none"
            />
          ))}
        </span>
      </span>
      {/* Pip's reach, lit when a piece is in it. */}
      <span
        aria-hidden="true"
        className={`absolute bottom-[6%] h-[34%] w-[17%] -translate-x-1/2 rounded-[50%] border-4 border-dashed transition-colors ${
          reaching === null ? 'border-ui-ink/15' : 'border-[#3f8a6a] bg-[#3f8a6a]/15'
        }`}
        style={{ left: `${PIP_X + 12}%` }}
      />
      {/* The cart of bins, behind Pip. */}
      <span
        aria-hidden="true"
        className="absolute bottom-[13%] left-[2%] flex items-end gap-0.5 px-1"
      >
        {/* The cart itself, its plank under the bins. */}
        <span className="absolute -bottom-[38%] left-0 w-[118%]">
          <CanvasArt draw={drawBinCart} width={200} height={70} className="h-auto w-full" />
        </span>
        {BINS.map((bin) => (
          <span key={bin} className="relative">
            <CanvasArt
              draw={BIN_DRAWINGS[bin]}
              width={90}
              height={100}
              className="h-8 w-auto sm:h-14"
            />
            {sortedNow
              .filter((moment) => moment.bin === bin)
              .map((moment) => (
                <span
                  key={moment.at}
                  className="ui-pop-in absolute -top-5 left-1/2 -translate-x-1/2"
                >
                  <CanvasArt
                    draw={LITTER_DRAWINGS[litter[moment.litter].look]}
                    width={100}
                    height={100}
                    className="size-7"
                  />
                </span>
              ))}
          </span>
        ))}
      </span>
      {/* Pip, walking. */}
      <span
        aria-hidden="true"
        className="ui-bob absolute bottom-[6%] h-[50%] -translate-x-1/2"
        style={{ left: `${PIP_X}%`, aspectRatio: '240 / 300' }}
      >
        <CanvasArt draw={drawPip} width={240} height={300} className="size-full" />
      </span>
      {/* The litter coming along the path. */}
      {coming.map(({ piece, index }) => {
        const share = (piece.at - state.now) / piece.travel;
        const left = PIP_X + 12 + share * (100 - PIP_X - 8);
        return (
          <span
            key={index}
            aria-hidden="true"
            className={`absolute bottom-[12%] -translate-x-1/2 ${
              index === reaching ? 'ui-wobble' : ''
            } ${state.now > piece.at + REACH_AFTER_MS ? 'opacity-40' : ''}`}
            style={{ left: `${left}%` }}
          >
            <span className="absolute -bottom-1 left-1/2 h-2 w-10 -translate-x-1/2 rounded-[50%] bg-ui-ink/20" />
            <CanvasArt
              draw={LITTER_DRAWINGS[piece.look]}
              width={100}
              height={100}
              className="size-12 drop-shadow-[0_2px_0_rgb(0_0_0/18%)] sm:size-14"
            />
          </span>
        );
      })}
      {floats.map((moment) => (
        <span
          key={`${moment.kind}-${moment.at}`}
          aria-hidden="true"
          className={`ui-float-up pointer-events-none absolute -translate-x-1/2 font-display text-xl whitespace-nowrap drop-shadow-[0_1px_0_#fbf6ea] ${
            moment.kind === 'sorted' || moment.kind === 'streak'
              ? 'text-[#3f8a6a]'
              : 'text-ui-danger'
          }`}
          style={{
            left: moment.kind === 'streak' ? '50%' : `${PIP_X + 12}%`,
            top: moment.kind === 'streak' ? '6%' : '22%',
          }}
        >
          {t(`moments.${moment.kind}`)}
        </span>
      ))}
    </div>
  );
}

function remarkOf(state: CleanupState, t: ReturnType<typeof useTranslations<'Garden.cleanup'>>) {
  const last = state.moments.at(-1);
  if (last && state.now - last.at < REMARK_MS) {
    return t(`pepin.${last.kind}`);
  }
  return state.sorted === 0 && state.mistakes === 0 ? t('pepin.start') : t('pepin.calm');
}
