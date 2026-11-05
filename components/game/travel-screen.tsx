'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { cutOut, drawBus, drawPip, seededRandom } from './paper-art';

// Going from one place to another: two cardboard flats close over the stage like a diorama's
// scenery, a ticket names where Pip is heading while he runs along, or the bus drives, and the
// flats open again on the new place once it is drawn.
export type TravelPhase = 'covering' | 'covered' | 'uncovering' | 'idle';
export type TravelMode = 'walk' | 'bus';

// How long the flats take to close and to open, and the least time the ticket stays up.
export const COVER_MILLISECONDS = 420;
export const UNCOVER_MILLISECONDS = 480;
export const MIN_COVERED_MILLISECONDS = 650;

export const TRAVEL_TIP_COUNT = 8;

// The inner edge of a flat, torn by hand: a jagged line down its side, the same on every trip.
function tornEdge(side: 'left' | 'right'): string {
  const random = seededRandom(side === 'left' ? 311 : 313);
  const points: string[] = [];
  for (let step = 0; step <= 40; step++) {
    const depth = 4 + random() * 22;
    const y = `${(step / 40) * 100}%`;
    points.push(side === 'left' ? `calc(100% - ${depth}px) ${y}` : `${depth}px ${y}`);
  }
  return side === 'left'
    ? `polygon(0 0, ${points.join(', ')}, 0 100%)`
    : `polygon(100% 0, 100% 100%, ${points.reverse().join(', ')})`;
}

const LEFT_EDGE = tornEdge('left');
const RIGHT_EDGE = tornEdge('right');

const KRAFT = {
  backgroundColor: 'var(--ui-kraft)',
  backgroundImage: [
    'repeating-linear-gradient(112deg, rgb(110 75 40 / 7%) 0 2px, transparent 2px 11px)',
    'repeating-linear-gradient(24deg, rgb(255 240 210 / 8%) 0 1px, transparent 1px 17px)',
    'radial-gradient(circle at 30% 40%, rgb(255 240 210 / 18%), transparent 60%)',
  ].join(', '),
};

function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

// Whether the player asks for less motion: the flats then fade instead of sliding.
function useCalm(): boolean {
  return useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

// One of the game's paper drawings, copied onto the page.
function Drawing({ source, className }: { source: HTMLCanvasElement; className: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const drawing = element?.getContext('2d');
    if (!element || !drawing) {
      return;
    }
    element.width = source.width;
    element.height = source.height;
    drawing.drawImage(source, 0, 0);
  }, [source]);
  return <canvas ref={canvas} className={className} />;
}

type Props = {
  phase: TravelPhase;
  // The place's name, as written on its signs.
  placeName: string;
  mode: TravelMode;
  // Which way Pip runs, the way he will face on arrival. The bus always drives to the right, so
  // that the line painted on it reads the right way round.
  facing: 1 | -1;
  tip: number;
  // Painted on the side of the bus.
  busLine: string;
};

export function TravelScreen({ phase, placeName, mode, facing: runFacing, tip, busLine }: Props) {
  const facing = mode === 'bus' ? 1 : runFacing;
  const t = useTranslations('Travel');
  const calm = useCalm();
  const isClosed = phase === 'covering' || phase === 'covered';
  const pip = useMemo(() => cutOut(240, 300, drawPip, 10, 21), []);
  const bus = useMemo(() => cutOut(560, 250, drawBus(busLine), 9, 68), [busLine]);
  const flatStyle = (side: 'left' | 'right') => ({
    ...KRAFT,
    clipPath: side === 'left' ? LEFT_EDGE : RIGHT_EDGE,
    transform: calm || isClosed ? 'none' : `translateX(${side === 'left' ? '-105%' : '105%'})`,
    opacity: calm && !isClosed ? 0 : 1,
    transition: calm
      ? 'opacity 300ms ease'
      : `transform ${isClosed ? COVER_MILLISECONDS : UNCOVER_MILLISECONDS}ms ${
          isClosed ? 'cubic-bezier(0.3, 0.9, 0.35, 1.06)' : 'cubic-bezier(0.55, 0, 0.75, 0.2)'
        }`,
  });
  // The ticket shows once the flats meet, and leaves before they part.
  const isTicketShown = phase === 'covered';

  return (
    <div
      aria-hidden={phase === 'idle'}
      className={`absolute inset-0 overflow-hidden ${phase === 'idle' ? 'pointer-events-none' : ''}`}
    >
      <div className="absolute inset-y-0 left-0 w-[calc(50%+3rem)] drop-shadow-[6px_0_6px_rgb(44_42_53/35%)]">
        <div className="absolute inset-0" style={flatStyle('left')} />
      </div>
      <div className="absolute inset-y-0 right-0 w-[calc(50%+3rem)] drop-shadow-[-6px_0_6px_rgb(44_42_53/35%)]">
        <div className="absolute inset-0" style={flatStyle('right')} />
      </div>
      <div
        role="status"
        className={`absolute inset-0 flex items-center justify-center px-4 transition-[opacity,transform] ${
          isTicketShown
            ? 'scale-100 opacity-100 delay-75 duration-200 ease-out'
            : 'scale-90 opacity-0 duration-150 ease-in'
        }`}
      >
        {phase !== 'idle' && (
          <div className="relative flex w-[min(26rem,100%)] -rotate-2 flex-col items-center ui-scrap px-6 pt-5 pb-4 font-game text-ui-ink">
            <span aria-hidden="true" className="ui-tape" />
            <p className="text-lg text-ui-ink/70">
              {mode === 'bus' ? t('nextStop') : t('headingTo')}
            </p>
            <p className="text-center font-display text-3xl leading-tight sm:text-4xl">
              {placeName}
            </p>
            {/* Pip on his way, or the bus driving: only a picture of the trip. */}
            <div aria-hidden="true" className="relative mt-3 h-28 w-full overflow-hidden">
              <div
                className="ui-travel-ground absolute inset-x-0 bottom-3 h-1 rounded-full opacity-30"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, var(--ui-ink) 0 1.4rem, transparent 1.4rem 2.6rem)',
                  animationDirection: facing === 1 ? 'normal' : 'reverse',
                }}
              />
              <div
                className="absolute bottom-3 left-1/2"
                style={{ transform: `translateX(-50%) scaleX(${facing})` }}
              >
                {[0, 1, 2].map((puff) => (
                  <span
                    key={puff}
                    className="ui-travel-puff absolute bottom-1 size-3 rounded-full bg-ui-paper shadow-[1px_1px_0_var(--ui-shadow)]"
                    style={{
                      left: mode === 'bus' ? '-0.6rem' : '0.4rem',
                      animationDelay: `${puff * 160}ms`,
                    }}
                  />
                ))}
                {mode === 'bus' ? (
                  <Drawing source={bus} className="ui-travel-rumble h-20 w-auto max-w-none" />
                ) : (
                  <Drawing source={pip} className="ui-travel-run h-24 w-auto max-w-none" />
                )}
              </div>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ui-ink/60">
              {t('loading')}
              <span aria-hidden="true" className="flex gap-1">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="ui-travel-dot size-1.5 rounded-full bg-ui-ink/60"
                    style={{ animationDelay: `${dot * 140}ms` }}
                  />
                ))}
              </span>
            </p>
            <p className="mt-3 border-t-2 border-dashed border-ui-ink/15 pt-2 text-center text-base">
              <span className="font-bold">{t('tip')}</span>{' '}
              {t(`tips.${tip % TRAVEL_TIP_COUNT}` as 'tips.0')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
