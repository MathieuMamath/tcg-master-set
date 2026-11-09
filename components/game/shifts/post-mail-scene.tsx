'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';
import {
  canFile,
  isOnCounter,
  MAIL_MISTAKE_LIMIT,
  type Mail,
  type MailState,
  mailBag,
  mailPoints,
  PIGEONHOLES,
  type Pigeonhole,
  simulateMail,
} from '@/game/quests/shifts/post-mail';
import { drawStamp } from '../art/post';
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

const MOMENT_MS = 800;
const REMARK_MS = 1500;

// The stamps of the pigeonholes, drawn once.
const STAMP_DRAWINGS = Object.fromEntries(
  PIGEONHOLES.map((sign) => [sign, drawStamp(sign)]),
) as Record<Pigeonhole, ReturnType<typeof drawStamp>>;

// Sorting the mail at Gustave's post stand: the pigeonholes on the wall, each a button with its
// stamp, and the letter on the counter. The keys 1 to 4 file it.
export function MailShift({ onDone }: { onDone: (end: ShiftEnd) => void }) {
  const t = useTranslations('Post.mail');
  const box = useRef<HTMLDivElement>(null);
  const simulate = useCallback(simulateMail, []);
  const { phase, state, start, press, showScore, secondsLeft } = useShift(
    'mail',
    simulate,
    mailPoints,
  );
  const isPlaying = phase.step === 'playing';
  const seed = phase.step === 'playing' ? phase.seed : 0;
  const bag = useMemo(() => mailBag(seed), [seed]);
  const file = (choice: number) => press(choice, (now) => canFile(now, bag, choice));

  return (
    <ShiftFrame
      host="postman"
      job="mail"
      phase={phase}
      onShowScore={showScore}
      secondsLeft={secondsLeft}
      howTo={t('howTo')}
      onStart={start}
      onDone={onDone}
      onKeyDown={digitKeys(isPlaying, PIGEONHOLES.length, file)}
      box={box}
    >
      {state && (
        <>
          <ScoreLine
            points={mailPoints(state)}
            mistakes={state.mistakes}
            limit={MAIL_MISTAKE_LIMIT}
          />
          <PostRoom state={state} bag={bag} onFile={file} />
          <HostSays host="postman" text={remarkOf(state, t)} />
        </>
      )}
    </ShiftFrame>
  );
}

// The post room: the wall of pigeonholes, each a button, and the counter with the letter on it.
function PostRoom({
  state,
  bag,
  onFile,
}: {
  state: MailState;
  bag: readonly Mail[];
  onFile: (choice: number) => void;
}) {
  const t = useTranslations('Post.mail');
  const mail = bag[state.current];
  const isThere = isOnCounter(state) && state.endedAt === null;
  const left = isThere ? Math.max(0, 1 - (state.now - state.arrivedAt) / mail.window) : 1;
  const filedNow = state.moments.filter(
    (moment) =>
      (moment.kind === 'filed' || moment.kind === 'express' || moment.kind === 'parcel') &&
      state.now - moment.at < MOMENT_MS,
  );
  const floats = state.moments.filter((moment) => state.now - moment.at < MOMENT_MS);

  return (
    <div className="relative mt-2 overflow-hidden rounded-sm bg-[#efe2c8] bg-[linear-gradient(90deg,rgb(107_74_46/10%)_0_2px,transparent_2px)] bg-size-[2.5rem_100%] p-2">
      {/* The wall of pigeonholes, each a button with its stamp. */}
      <div className="grid grid-cols-4 gap-1.5 rounded-sm bg-[#8a5a34] p-1.5 shadow-[inset_0_2px_0_rgb(0_0_0/20%)]">
        {PIGEONHOLES.map((sign, index) => (
          <button
            key={sign}
            type="button"
            aria-label={t(`pigeonholes.${sign}`)}
            {...pressHandlers(() => onFile(index))}
            className="relative flex cursor-pointer touch-manipulation flex-col items-center rounded-sm bg-[#4a2f1c] px-1 pt-1.5 pb-1 text-[#fbf6ea] outline-none select-none active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp"
          >
            <CanvasArt
              draw={STAMP_DRAWINGS[sign]}
              width={100}
              height={100}
              className="size-10 sm:size-12"
            />
            <span className="mt-0.5 text-sm leading-tight">
              <kbd className="font-digits text-xs opacity-70 pointer-coarse:hidden">
                {index + 1}{' '}
              </kbd>
              {t(`pigeonholes.${sign}`)}
            </span>
            {filedNow
              .filter((moment) => bag[moment.mail].to === sign)
              .map((moment) => (
                <span
                  key={moment.at}
                  aria-hidden="true"
                  className="ui-pop-in absolute top-1 right-1 h-4 w-6 rounded-[2px] bg-[#fbf6ea] shadow-[1px_1px_0_rgb(0_0_0/25%)]"
                />
              ))}
          </button>
        ))}
      </div>
      {/* The counter, and the letter on it, sliding on from the right. */}
      <div
        aria-live="polite"
        className="relative mt-3 flex h-36 items-center justify-center rounded-sm bg-[#a87644] shadow-[inset_0_6px_0_#7f5530] sm:h-40"
      >
        {isThere ? (
          <span
            key={state.current}
            className={`ui-seat-in relative flex items-center justify-center ${
              mail.kind === 'parcel' ? 'h-24 w-32' : 'h-20 w-36'
            }`}
          >
            <span className="sr-only">
              {t('counter', { kind: t(`kinds.${mail.kind}`), to: t(`pigeonholes.${mail.to}`) })}
            </span>
            <Envelope mail={mail} isHalfFiled={state.isHalfFiled} />
            {/* How long until it slips off the counter. */}
            <span className="absolute -bottom-4 left-0 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
              <span
                className={`block h-full rounded-full ${left < 0.3 ? 'bg-ui-danger' : 'bg-[#fbf6ea]'}`}
                style={{ width: `${left * 100}%` }}
              />
            </span>
          </span>
        ) : (
          <span className="text-[#fbf6ea]/70">{t('empty')}</span>
        )}
      </div>
      {floats.map((moment) => (
        <span
          key={`${moment.kind}-${moment.at}`}
          aria-hidden="true"
          className={`ui-float-up pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 font-display text-xl whitespace-nowrap drop-shadow-[0_1px_0_#fbf6ea] ${
            moment.kind === 'wrong' || moment.kind === 'slipped'
              ? 'text-ui-danger'
              : 'text-[#3f8a6a]'
          }`}
        >
          {t(`moments.${moment.kind}`)}
        </span>
      ))}
    </div>
  );
}

// A letter, an express letter edged in red, or a parcel tied with string, with its stamp.
function Envelope({ mail, isHalfFiled }: { mail: Mail; isHalfFiled: boolean }) {
  if (mail.kind === 'parcel') {
    return (
      <span
        className={`relative block size-full rounded-sm bg-[#c99a5b] shadow-[2px_3px_0_rgb(0_0_0/25%)] ${
          isHalfFiled ? 'ui-shake' : ''
        }`}
      >
        <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-[#7a4e2a]" />
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-[#7a4e2a]" />
        <span className="absolute top-1 right-1">
          <CanvasArt draw={STAMP_DRAWINGS[mail.to]} width={100} height={100} className="size-10" />
        </span>
      </span>
    );
  }
  return (
    <span
      className={`relative block size-full rounded-sm bg-[#fbf6ea] shadow-[2px_3px_0_rgb(0_0_0/25%)] ${
        mail.kind === 'express' ? 'border-[5px] border-dashed border-[#d0443a]' : ''
      }`}
    >
      {/* The flap. */}
      <span className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(to_bottom_right,transparent_49%,rgb(44_42_53/12%)_50%,transparent_51%),linear-gradient(to_bottom_left,transparent_49%,rgb(44_42_53/12%)_50%,transparent_51%)] bg-size-[50%_100%] bg-position-[left,right] bg-no-repeat" />
      <span className="absolute bottom-3 left-3 flex flex-col gap-1">
        <span className="block h-1 w-14 rounded-full bg-ui-ink/25" />
        <span className="block h-1 w-10 rounded-full bg-ui-ink/25" />
      </span>
      <span className="absolute top-1.5 right-1.5">
        <CanvasArt draw={STAMP_DRAWINGS[mail.to]} width={100} height={100} className="size-11" />
      </span>
    </span>
  );
}

function remarkOf(state: MailState, t: ReturnType<typeof useTranslations<'Post.mail'>>) {
  const last = state.moments.at(-1);
  if (last && state.now - last.at < REMARK_MS) {
    return t(`gustave.${last.kind}`);
  }
  return state.score === 0 && state.mistakes === 0 ? t('gustave.start') : t('gustave.calm');
}
