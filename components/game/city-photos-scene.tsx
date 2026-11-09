'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, useCallback, useMemo, useRef } from 'react';
import {
  canShoot,
  FLASH_MS,
  filmLeft,
  nearestSubject,
  PHOTO_QUALITIES,
  PHOTO_ROLL,
  PHOTOS_MISTAKE_LIMIT,
  type Photo,
  type PhotoQuality,
  type PhotosState,
  photosPoints,
  qualityOf,
  type Subject,
  simulatePhotos,
  skySubjects,
  subjectAt,
} from '@/game/city-photos';
import { moveThroughChoices } from './menu-focus';
import {
  cutOut,
  drawCityScenery,
  drawSkyBalloon,
  drawSkyKite,
  SKY_BALLOON_CENTRE,
  SKY_BALLOON_SIZE,
  SKY_KITE_CENTRE,
  SKY_KITE_SIZE,
} from './paper-art';
import { HostSays, Mistakes, pressHandlers, type ShiftEnd, ShiftFrame, useShift } from './shift';

const MOMENT_MS = 900;
const REMARK_MS = 1600;
// How long the shutter's blades take to close and open again.
const SHUTTER_MS = 240;

const BALLOON_COLORS = [
  ['#d0443a', '#f0c43a'],
  ['#3c78b4', '#fbf6ea'],
  ['#4f8a3c', '#f0c43a'],
  ['#9d7bb8', '#fbf6ea'],
] as const;
const KITE_COLORS = [
  ['#d0443a', '#f0c43a'],
  ['#3c78b4', '#f08a7e'],
  ['#4f8a3c', '#fbf6ea'],
] as const;

// The drawings, made once when first needed, as pictures the scene can place anywhere.
let pictures: { sky: string; balloons: string[]; kites: string[] } | null = null;
function usePictures() {
  return useMemo(() => {
    pictures ??= {
      sky: drawCityScenery().toDataURL(),
      balloons: BALLOON_COLORS.map((colors, index) =>
        cutOut(
          SKY_BALLOON_SIZE.width,
          SKY_BALLOON_SIZE.height,
          drawSkyBalloon(colors),
          7,
          460 + index,
        ).toDataURL(),
      ),
      kites: KITE_COLORS.map((colors, index) =>
        cutOut(
          SKY_KITE_SIZE.width,
          SKY_KITE_SIZE.height,
          drawSkyKite(colors),
          7,
          470 + index,
        ).toDataURL(),
      ),
    };
    return pictures;
  }, []);
}
type Pictures = ReturnType<typeof usePictures>;

// Flash's photos of the big city's sky: his camera, its viewfinder over the towers with balloons
// and kites crossing it, the shutter, and the roll of film filling with the photos taken. The space
// bar, Enter, the button or a touch of the viewfinder takes a photo.
export function PhotosShift({ onDone }: { onDone: (end: ShiftEnd) => void }) {
  const t = useTranslations('Photos.photos');
  const tShift = useTranslations('Shift');
  const box = useRef<HTMLDivElement>(null);
  const simulate = useCallback(simulatePhotos, []);
  const { phase, state, start, press, showScore, secondsLeft } = useShift(
    'photos',
    simulate,
    photosPoints,
  );
  const isPlaying = phase.step === 'playing';
  const seed = phase.step === 'playing' ? phase.seed : 0;
  const subjects = useMemo(() => skySubjects(seed), [seed]);
  const pictures = usePictures();
  const shoot = () => press(0, canShoot);

  // Space and Enter take a photo, unless the focus is on another button, such as the one to stop.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const isOtherButton =
      event.target instanceof HTMLElement &&
      event.target.closest('button') !== null &&
      !event.target.closest('[data-shutter]');
    if (isPlaying && !isOtherButton && (event.code === 'Space' || event.code === 'Enter')) {
      event.preventDefault();
      if (!event.repeat) {
        shoot();
      }
      return;
    }
    moveThroughChoices(event);
  };

  const isReady = state !== null && canShoot(state);

  return (
    <ShiftFrame
      host="photographer"
      job="photos"
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
              <span className="font-digits font-bold tabular-nums">{photosPoints(state)}</span>
            </span>
            <Mistakes count={state.mistakes} limit={PHOTOS_MISTAKE_LIMIT} />
          </div>
          {/* The camera: its top plate, the viewfinder, and the roll of film below. */}
          <div className="mt-1.5 rounded-xl bg-[linear-gradient(#3a3744,#25232d)] p-2 shadow-[2px_4px_0_var(--ui-shadow)]">
            <div className="mb-1.5 flex items-center justify-between px-1 font-digits text-xs text-[#fbf6ea]/80">
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${isReady ? 'bg-[#7ed36b]' : 'bg-[#e8b33e]'}`}
                />
                {isReady ? t('ready') : t('charging')}
              </span>
              <span className="rounded-sm bg-[#9fb59a] px-1.5 py-0.5 text-[#25232d] tabular-nums">
                <span className="sr-only">{t('film', { count: filmLeft(state) })}</span>
                <span aria-hidden="true">
                  {filmLeft(state)}/{PHOTO_ROLL}
                </span>
              </span>
            </div>
            <Viewfinder state={state} subjects={subjects} pictures={pictures} onShoot={shoot} />
            <FilmStrip state={state} subjects={subjects} pictures={pictures} />
          </div>
          <button
            type="button"
            data-first-focus
            data-shutter
            {...pressHandlers(shoot)}
            aria-disabled={!isReady}
            className="mt-2 flex min-h-14 w-full cursor-pointer touch-manipulation items-center justify-center gap-2.5 rounded-full bg-[#2c2a35] px-3 text-lg text-[#fbf6ea] shadow-[2px_3px_0_var(--ui-shadow)] outline-none select-none active:translate-y-0.5 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-disabled:opacity-45"
          >
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-full border-[3px] border-[#e8b33e]"
            >
              <span className="size-3 rounded-full bg-[#d0443a]" />
            </span>
            {isReady ? t('shoot') : t('charging')}
            <kbd className="ml-1 font-digits text-xs opacity-70 pointer-coarse:hidden">␣</kbd>
          </button>
          <HostSays host="photographer" text={remarkOf(state, t)} />
        </>
      )}
    </ShiftFrame>
  );
}

// A balloon or a kite in the sky, placed by the point of it that counts: the middle of the balloon's
// envelope, or the kite's crossing spars. A kite's tail flutters behind it.
function SkySubject({
  subject,
  index,
  at,
  pictures,
  width,
}: {
  subject: Subject;
  index: number;
  at: number;
  pictures: Pictures;
  // How wide, as a share of the frame.
  width: number;
}) {
  const place = subjectAt(subject, at);
  if (!place) {
    return null;
  }
  const isKite = subject.kind === 'kite';
  const picture = isKite
    ? pictures.kites[index % pictures.kites.length]
    : pictures.balloons[index % pictures.balloons.length];
  const size = isKite ? SKY_KITE_SIZE : SKY_BALLOON_SIZE;
  const centre = isKite ? SKY_KITE_CENTRE : SKY_BALLOON_CENTRE;
  const tilt = isKite ? Math.sin(at / 300 + index) * 12 : Math.sin(at / 900 + index) * 3;
  const tail = Array.from({ length: 6 }, (_, step) => {
    const along = step * 14;
    return `${50 + Math.sin(at / 160 - step * 0.9 + index) * (4 + step * 2)},${along}`;
  }).join(' ');
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        left: `${place.x}%`,
        top: `${place.y}%`,
        width: `${width * (isKite ? 0.85 : 1)}%`,
        aspectRatio: `${size.width} / ${size.height}`,
        transform: `translate(-50%, -${centre * 100}%) rotate(${tilt}deg)`,
      }}
    >
      {isKite && (
        <svg
          aria-hidden="true"
          viewBox="0 0 100 80"
          className="absolute top-[86%] left-0 h-[80%] w-full overflow-visible"
        >
          <polyline
            points={tail}
            fill="none"
            stroke="#fffdf6"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <polyline
            points={tail}
            fill="none"
            stroke="#6b4a2e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {[1, 3, 5].map((step) => {
            const [bowX, bowY] = tail.split(' ')[step].split(',').map(Number);
            return (
              <path
                key={step}
                d={`M${bowX - 7} ${bowY - 5} L${bowX + 7} ${bowY + 5} L${bowX + 7} ${bowY - 5} L${bowX - 7} ${bowY + 5} Z`}
                fill={KITE_COLORS[index % KITE_COLORS.length][1]}
                stroke="#fffdf6"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      )}
      <span
        className="absolute inset-0 bg-contain bg-no-repeat"
        style={{ backgroundImage: `url(${picture})` }}
      />
    </span>
  );
}

// The viewfinder: the city's sky, the balloons and kites crossing it, the focus marks at the centre,
// which light up as something passes through them, and the shutter's blades at each shot. A touch
// takes a photo.
function Viewfinder({
  state,
  subjects,
  pictures,
  onShoot,
}: {
  state: PhotosState;
  subjects: readonly Subject[];
  pictures: Pictures;
  onShoot: () => void;
}) {
  const t = useTranslations('Photos.photos');
  const flying = subjects
    .map((subject, index) => ({ subject, index }))
    .filter(({ subject }) => subjectAt(subject, state.now) !== null);
  const nearest = nearestSubject(subjects, state.now);
  const focus = nearest ? qualityOf(nearest.distance) : 'missed';
  const last = state.photos.at(-1);
  const sinceShot = last ? state.now - last.at : Number.POSITIVE_INFINITY;
  // The blades close then open again, then the flash fades.
  const blades = sinceShot < SHUTTER_MS ? 1 - Math.abs((2 * sinceShot) / SHUTTER_MS - 1) : 0;
  const flash = sinceShot < FLASH_MS ? Math.max(0, 1 - sinceShot / (FLASH_MS * 0.6)) : 0;
  const recent = last && sinceShot < MOMENT_MS ? last : null;
  const focusColor =
    focus === 'sharp' ? '#7ed36b' : focus === 'good' ? '#e8b33e' : 'rgb(255 255 255 / 75%)';
  const [sharp, good] = PHOTO_QUALITIES;

  return (
    <div
      role="img"
      aria-label={t('viewfinder', { count: flying.length })}
      onPointerDown={(event) => {
        event.preventDefault();
        onShoot();
      }}
      className="relative aspect-[3/2] w-full cursor-crosshair touch-manipulation overflow-hidden rounded-md bg-cover bg-center select-none"
      style={{ backgroundImage: `url(${pictures.sky})` }}
    >
      {flying.map(({ subject, index }) => (
        <SkySubject
          key={index}
          subject={subject}
          index={index}
          at={state.now}
          pictures={pictures}
          width={13}
        />
      ))}
      {/* A soft vignette, and the thirds' lines, as through a real viewfinder. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(20_18_30/45%))]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_33.2%,rgb(255_255_255/18%)_33.3%,transparent_33.5%,transparent_66.5%,rgb(255_255_255/18%)_66.6%,transparent_66.8%),linear-gradient(transparent_33.2%,rgb(255_255_255/18%)_33.3%,transparent_33.5%,transparent_66.5%,rgb(255_255_255/18%)_66.6%,transparent_66.8%)]"
      />
      {/* The focus marks: four brackets round where a photo is good, a ring where it is sharp. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors duration-150"
        style={{ width: `${good.within * 2}%`, height: `${good.within * 2}%`, color: focusColor }}
      >
        {[
          'top-0 left-0 border-t-[3px] border-l-[3px]',
          'top-0 right-0 border-t-[3px] border-r-[3px]',
          'bottom-0 left-0 border-b-[3px] border-l-[3px]',
          'right-0 bottom-0 border-r-[3px] border-b-[3px]',
        ].map((corner) => (
          <span key={corner} className={`absolute size-[26%] border-current ${corner}`} />
        ))}
        <span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-current"
          style={{
            width: `${(sharp.within / good.within) * 100}%`,
            height: `${(sharp.within / good.within) * 100}%`,
          }}
        />
        <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
      </span>
      {/* The frame's corners. */}
      {[
        'top-2 left-2 border-t-2 border-l-2',
        'top-2 right-2 border-t-2 border-r-2',
        'bottom-2 left-2 border-b-2 border-l-2',
        'right-2 bottom-2 border-r-2 border-b-2',
      ].map((corner) => (
        <span
          key={corner}
          aria-hidden="true"
          className={`pointer-events-none absolute size-5 border-white/85 ${corner}`}
        />
      ))}
      {/* The shutter's blades, closing from above and below. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 bg-[#15131c]"
        style={{ height: `${blades * 51}%` }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-[#15131c]"
        style={{ height: `${blades * 51}%` }}
      />
      {flash > 0 && blades === 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-white"
          style={{ opacity: flash * 0.7 }}
        />
      )}
      {recent && (
        <span
          key={recent.at}
          aria-hidden="true"
          className={`ui-float-up pointer-events-none absolute top-[22%] left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 font-display text-xl whitespace-nowrap shadow-[1px_2px_0_rgb(0_0_0/30%)] ${
            QUALITY_BADGES[recent.quality]
          }`}
        >
          {t(`qualities.${recent.quality}`)}
          {recent.points > 0 && ` +${recent.points}`}
        </span>
      )}
    </div>
  );
}

const QUALITY_BADGES: Record<PhotoQuality, string> = {
  sharp: 'bg-[#7ed36b] text-[#1f3a1a]',
  good: 'bg-[#e8b33e] text-[#3a2a08]',
  fair: 'bg-[#fbf6ea] text-ui-ink',
  missed: 'bg-ui-danger text-[#fbf6ea]',
};

// How blurred a photo comes out, by how well it was taken.
const QUALITY_BLUR: Record<PhotoQuality, string> = {
  sharp: 'none',
  good: 'blur(0.6px)',
  fair: 'blur(1.6px)',
  missed: 'blur(2px)',
};

// The roll of film under the viewfinder: a frame for each photo, the ones taken showing what they
// caught, sharp or blurred, the others still dark.
function FilmStrip({
  state,
  subjects,
  pictures,
}: {
  state: PhotosState;
  subjects: readonly Subject[];
  pictures: Pictures;
}) {
  return (
    <div
      aria-hidden="true"
      className="mt-2 grid grid-cols-8 gap-1 rounded-sm bg-[#15131c] px-1 py-2 bg-[radial-gradient(circle,#3a3744_35%,transparent_40%)] bg-size-[10px_6px] bg-repeat-x"
    >
      {Array.from({ length: PHOTO_ROLL }, (_, index) => index).map((index) => {
        const photo = state.photos[index];
        return photo ? (
          <ShotFrame key={index} photo={photo} subjects={subjects} pictures={pictures} />
        ) : (
          <span key={index} className="aspect-[3/2] rounded-[2px] bg-[#2a2733]" />
        );
      })}
    </div>
  );
}

function ShotFrame({
  photo,
  subjects,
  pictures,
}: {
  photo: Photo;
  subjects: readonly Subject[];
  pictures: Pictures;
}) {
  return (
    <span className="ui-pop-in relative aspect-[3/2] overflow-hidden rounded-[2px] bg-[#fbf6ea] p-px">
      {/* The print shows the middle of the frame, where the photo was aimed, blurred by how well it
          was taken. */}
      <span className="relative block size-full overflow-hidden">
        <span
          className="absolute inset-0 scale-[2.2] bg-cover bg-center"
          style={{ backgroundImage: `url(${pictures.sky})`, filter: QUALITY_BLUR[photo.quality] }}
        >
          {photo.subject !== null && (
            <SkySubject
              subject={subjects[photo.subject]}
              index={photo.subject}
              at={photo.at}
              pictures={pictures}
              width={13}
            />
          )}
        </span>
      </span>
      <span className={`absolute inset-x-0 bottom-0 h-1 ${QUALITY_STRIPES[photo.quality]}`} />
    </span>
  );
}

const QUALITY_STRIPES: Record<PhotoQuality, string> = {
  sharp: 'bg-[#7ed36b]',
  good: 'bg-[#e8b33e]',
  fair: 'bg-[#fbf6ea]',
  missed: 'bg-ui-danger',
};

function remarkOf(state: PhotosState, t: ReturnType<typeof useTranslations<'Photos.photos'>>) {
  const last = state.photos.at(-1);
  if (last && state.now - last.at < REMARK_MS) {
    return t(`flash.${last.quality}`);
  }
  return state.photos.length === 0 ? t('flash.start') : t('flash.calm');
}
