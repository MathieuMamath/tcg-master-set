'use client';

import { useTranslations } from 'next-intl';
import {
  createContext,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  QUICKEST_PRESS_MS,
  SHIFT_RULES,
  type ShiftAction,
  type ShiftJob,
  shiftStars,
} from '@/game/quests/shifts/shifts';
import type { ShiftOutcome } from '@/player/quests/shifts';
import { focusFirstChoice, moveThroughChoices } from '../menu-focus';
import { SellerPortrait } from '../shop/seller-portrait';
import { CHOICE_CLASS, TornPaper } from '../shop/shop-dialog';

// Whether the shift was opened straight from a conversation, such as Papy Caillou's, so that its
// first screen has nowhere to go back to: its button then just closes it.
export const ShiftOpenedDirectly = createContext(false);

// Who a shift is played for: Yuzu at the ramen shop, Maître Kaito at the dojo, Pépin in the park's
// garden, Papy Caillou at the lake, Bérénice at her raffle stand, Gustave at the village post, or
// Flash on the big city's pavement.
export type ShiftHost =
  | 'ramenChef'
  | 'dojoMaster'
  | 'gardener'
  | 'grandpa'
  | 'berenice'
  | 'postman'
  | 'photographer';

// How a shift ends for its host's conversation: what the server counted, nothing it could count, or
// the player stopping.
export type ShiftEnd = ShiftOutcome | null | 'gaveUp';

export type ShiftPhase =
  | { step: 'ready' }
  | { step: 'starting' }
  // Once over, the board stays as the last move left it, until the player asks for the score.
  | { step: 'playing'; seed: number; startedAt: number; isOver: boolean }
  | { step: 'checking'; points: number }
  | { step: 'result'; result: ShiftOutcome }
  | { step: 'error' };

type Simulated = { endedAt: number | null };

// A shift's life: started on the server, which sends its seed, then played frame by frame from the
// seed and the presses, by the same simulation as the server's, then sent to be counted.
export function useShift<State extends Simulated>(
  job: ShiftJob,
  simulate: (seed: number, presses: readonly ShiftAction[], until: number) => State | null,
  points: (state: State) => number,
) {
  const shiftMs = SHIFT_RULES[job].seconds * 1000;
  const [phase, setPhase] = useState<ShiftPhase>({ step: 'ready' });
  const [elapsed, setElapsed] = useState(0);
  // Bumped with each press, so that the simulation plays it.
  const [pressCount, setPressCount] = useState(0);
  const actions = useRef<ShiftAction[]>([]);
  const isOver = useRef(false);
  const seed = phase.step === 'playing' ? phase.seed : 0;
  const startedAt = phase.step === 'playing' ? phase.startedAt : 0;
  const isPlaying = phase.step === 'playing';
  const isFrozen = phase.step === 'playing' && phase.isOver;
  // What the server counted, which arrives while the board is still shown, and whether the player
  // asked to see it.
  const [outcome, setOutcome] = useState<ShiftOutcome | 'error' | null>(null);
  const [wantsScore, setWantsScore] = useState(false);
  const endPoints = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pressCount tells when the actions changed.
  const state = useMemo(
    () => (isPlaying ? simulate(seed, actions.current, Math.min(elapsed, shiftMs)) : null),
    [isPlaying, seed, elapsed, shiftMs, simulate, pressCount],
  );

  const finish = useCallback(
    async (score: number) => {
      if (isOver.current) {
        return;
      }
      isOver.current = true;
      endPoints.current = score;
      setPhase((now) => (now.step === 'playing' ? { ...now, isOver: true } : now));
      try {
        const response = await fetch(`/api/quests/shift/finish?job=${job}`, {
          method: 'POST',
          body: JSON.stringify({ actions: actions.current }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        setOutcome(await response.json());
      } catch {
        setOutcome('error');
      }
    },
    [job],
  );

  // The score shows once asked for, after the server's answer if it is still on its way.
  useEffect(() => {
    if (!wantsScore) {
      return;
    }
    if (outcome === null) {
      setPhase({ step: 'checking', points: endPoints.current });
    } else if (outcome === 'error') {
      setPhase({ step: 'error' });
    } else {
      setPhase({ step: 'result', result: outcome });
    }
  }, [wantsScore, outcome]);

  // The clock, every frame, so that the gauges move smoothly. It stops with the shift, which leaves
  // the board as the last move left it.
  useEffect(() => {
    if (!isPlaying || isFrozen) {
      return;
    }
    let frame = requestAnimationFrame(function tick() {
      setElapsed(performance.now() - startedAt);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, isFrozen, startedAt]);

  // The shift ends when its time is up, or once its end has come: its last mistake, or its last
  // pebble or arrow landing, which can come a moment after it was thrown. The server counts the
  // shift from that end, so it must not be sent before.
  useEffect(() => {
    if (state && ((state.endedAt !== null && elapsed >= state.endedAt) || elapsed >= shiftMs)) {
      finish(points(state));
    }
  }, [state, elapsed, shiftMs, finish, points]);

  const start = async () => {
    setPhase({ step: 'starting' });
    try {
      const response = await fetch(`/api/quests/shift/start?job=${job}`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const answer: { seed: number } = await response.json();
      actions.current = [];
      isOver.current = false;
      setOutcome(null);
      setWantsScore(false);
      setElapsed(0);
      setPhase({
        step: 'playing',
        seed: answer.seed,
        startedAt: performance.now(),
        isOver: false,
      });
    } catch {
      setPhase({ step: 'error' });
    }
  };

  // A press, kept to be sent at the end, when it would do something now: the simulation tells.
  // Whether it was kept, since a press too soon after the last one is not.
  const press = (choice: number, canPress: (now: State) => boolean): boolean => {
    if (!isPlaying || isOver.current) {
      return false;
    }
    const ms = Math.round(performance.now() - startedAt);
    const previous = actions.current.at(-1)?.[0];
    if (ms > shiftMs || (previous !== undefined && ms - previous < QUICKEST_PRESS_MS)) {
      return false;
    }
    const now = simulate(seed, actions.current, ms);
    if (!now || now.endedAt !== null || !canPress(now)) {
      return false;
    }
    actions.current.push([ms, choice]);
    setPressCount((count) => count + 1);
    return true;
  };

  return {
    phase,
    state,
    start,
    press,
    showScore: () => setWantsScore(true),
    secondsLeft: Math.max(0, Math.ceil((shiftMs - elapsed) / 1000)),
  };
}

// The number keys press a board's buttons, as a quicker way than moving between them.
export function digitKeys(isPlaying: boolean, choices: number, onPress: (choice: number) => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code)?.[1];
    if (isPlaying && digit && Number(digit) <= choices) {
      event.preventDefault();
      if (!event.repeat) {
        onPress(Number(digit) - 1);
      }
      return;
    }
    moveThroughChoices(event);
  };
}

// A drawing from the paper world, made once on its own canvas, beside its name.
export function CanvasArt({
  draw,
  width,
  height,
  className,
}: {
  draw: (drawing: CanvasRenderingContext2D, width: number, height: number) => void;
  width: number;
  height: number;
  className: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const drawing = canvas.current?.getContext('2d');
    if (drawing) {
      drawing.clearRect(0, 0, width, height);
      draw(drawing, width, height);
    }
  }, [draw, width, height]);
  return (
    <span aria-hidden="true" className="contents">
      <canvas ref={canvas} width={width} height={height} className={className} />
    </span>
  );
}

export function Stars({ count }: { count: number }) {
  const t = useTranslations('Shift');
  return (
    <p
      className="mt-2 flex justify-center gap-2 text-4xl"
      role="img"
      aria-label={t('stars', { count })}
    >
      {[1, 2, 3].map((star) => (
        <span
          key={star}
          aria-hidden="true"
          className={`ui-pop-in ${star <= count ? 'text-[#e8b33e]' : 'text-ui-ink/15'}`}
          style={{ animationDelay: `${star * 160}ms` }}
        >
          ★
        </span>
      ))}
    </p>
  );
}

export function Mistakes({ count, limit }: { count: number; limit: number }) {
  const t = useTranslations('Shift');
  return (
    <span className="flex items-center gap-1.5">
      {t('mistakes')}
      <span className="sr-only">{`${count} / ${limit}`}</span>
      {Array.from({ length: limit }, (_, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: the marks never move.
          key={index}
          aria-hidden="true"
          className={`size-3.5 rounded-full border-2 border-ui-ink/40 ${
            index < count ? 'bg-ui-danger' : 'bg-transparent'
          }`}
        />
      ))}
    </span>
  );
}

// The host, at the bottom of a shift, cheering on or wincing.
export function HostSays({ host, text }: { host: ShiftHost; text: string }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="block size-11 shrink-0 overflow-hidden rounded-full border-2 border-[#fbf6ea] bg-[#e7d9bc] shadow-[1px_2px_0_var(--ui-shadow)]">
        <SellerPortrait stock={host} />
      </span>
      <p
        aria-live="polite"
        className="relative rounded-xl bg-[#fbf6ea] px-3 py-1 text-base leading-snug shadow-[2px_3px_0_var(--ui-shadow)]"
      >
        {text}
      </p>
    </div>
  );
}

// A page of a shift's guide, shown before it starts: a picture of what the player will see, and a few
// words about it.
export type ShiftTip = { title: string; text: string; picture?: ReactNode };

// The frame around a shift: its title and clock, how to play before it starts, with a guide to leaf
// through for the shifts that have one, the score while it runs, and the stars once it is counted.
export function ShiftFrame({
  job,
  host,
  phase,
  secondsLeft,
  howTo,
  tips,
  onStart,
  onShowScore,
  onDone,
  onKeyDown,
  onKeyUp,
  box,
  children,
}: {
  job: ShiftJob;
  host: ShiftHost;
  phase: ShiftPhase;
  secondsLeft: number;
  howTo: string;
  tips?: readonly ShiftTip[];
  onStart: () => void;
  onShowScore: () => void;
  onDone: (end: ShiftEnd) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  // For a game played by holding a key, such as drawing a bow.
  onKeyUp?: (event: KeyboardEvent<HTMLElement>) => void;
  box: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const t = useTranslations('Shift');
  const tHost = useTranslations(`Shift.hosts.${host}`);
  const isOpenedDirectly = useContext(ShiftOpenedDirectly);
  const rules = SHIFT_RULES[job];
  const isOver = phase.step === 'playing' && phase.isOver;
  const scoreButton = useRef<HTMLButtonElement>(null);
  // The guide's page being read, or null while how to play shows.
  const [tipShown, setTipShown] = useState<number | null>(null);
  const tipButton = useRef<HTMLButtonElement>(null);

  // Each page of the guide puts the focus on the button that leads on, and leaving the guide puts it
  // back on the first choice.
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      tipShown === null ? box.current && focusFirstChoice(box.current) : tipButton.current?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [tipShown, box]);

  // Once over, the button to see the score takes the focus, for the keyboard.
  useEffect(() => {
    if (isOver) {
      scoreButton.current?.focus();
      // On a small screen, the button can sit below the fold.
      scoreButton.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isOver]);

  useEffect(() => {
    if (phase.step !== 'starting' && phase.step !== 'checking') {
      const frame = requestAnimationFrame(() => box.current && focusFirstChoice(box.current));
      return () => cancelAnimationFrame(frame);
    }
  }, [phase.step, box]);

  return (
    // A click on the board, or anywhere but a control, would take the focus off the board's buttons
    // and leave the keys nowhere to go: playing with the mouse then the keyboard must just work.
    // biome-ignore lint/a11y/noStaticElementInteractions: the keys reach the board's buttons inside.
    <div
      ref={box}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onMouseDown={(event) => {
        if (!(event.target as HTMLElement).closest('button, a, input, select, textarea')) {
          event.preventDefault();
        }
      }}
    >
      <TornPaper className="px-3 pt-4 pb-4 sm:px-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="shift-title" className="font-display text-xl">
            {t(`titles.${job}`)}
          </h2>
          {phase.step === 'playing' &&
            (isOver ? (
              // The clock stops with the shift: saying so, rather than showing the seconds it
              // stopped at, which looked like a game stuck halfway.
              <p className="ui-pop-in font-display text-lg text-[#3f8a6a]">{t('finished')}</p>
            ) : (
              <p className="font-digits text-lg font-bold tabular-nums">
                {t('timeLeft', { seconds: secondsLeft })}
              </p>
            ))}
        </div>

        {tips && tipShown !== null && (phase.step === 'ready' || phase.step === 'starting') && (
          <TipsCarousel
            tips={tips}
            index={tipShown}
            nextButton={tipButton}
            onShow={setTipShown}
            onStart={() => {
              setTipShown(null);
              onStart();
            }}
            onBack={() => setTipShown(null)}
          />
        )}

        {tipShown === null && (phase.step === 'ready' || phase.step === 'starting') && (
          <>
            <p className="mt-2 text-lg leading-snug">{howTo}</p>
            <ul className="mt-2 text-ui-ink/70">
              {rules.pay.map(({ score, coins }) => (
                <li key={score}>{t('pay', { score, coins })}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                aria-disabled={phase.step === 'starting'}
                onClick={() => phase.step === 'ready' && onStart()}
                className={`${CHOICE_CLASS} bg-ui-accent!`}
              >
                {t('start')}
              </button>
              {tips && (
                <button type="button" onClick={() => setTipShown(0)} className={CHOICE_CLASS}>
                  {t('tips.show')}
                </button>
              )}
              <button type="button" onClick={() => onDone('gaveUp')} className={CHOICE_CLASS}>
                {isOpenedDirectly ? t('notNow') : tHost('back')}
              </button>
            </div>
          </>
        )}

        {phase.step === 'playing' && (
          <>
            {/* Once over, the board stays as the last move left it, but no longer answers, and the
                host's words say the shift is over, so that it doesn't look stuck. */}
            <div className="relative">
              <div inert={isOver}>{children}</div>
              {isOver && (
                <p className="pointer-events-none absolute inset-x-0 top-10 z-20 flex justify-center">
                  <span className="ui-pop-in -rotate-3 ui-scrap bg-ui-accent px-5 py-1 font-display text-2xl">
                    {tHost('over')}
                  </span>
                </p>
              )}
            </div>
            {isOver ? (
              <div className="mt-3 flex justify-center">
                <button
                  ref={scoreButton}
                  type="button"
                  onClick={onShowScore}
                  className={`${CHOICE_CLASS} ui-pop-in ui-bob bg-ui-accent! px-6! text-xl!`}
                >
                  {t('seeScore')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onDone('gaveUp')}
                className="mt-2 cursor-pointer text-ui-ink/70 underline"
              >
                {t('giveUp')}
              </button>
            )}
          </>
        )}

        {phase.step === 'checking' && (
          <>
            <Stars count={shiftStars(job, phase.points)} />
            <p className="mt-2 text-center text-lg">{tHost('checking')}</p>
          </>
        )}

        {phase.step === 'result' && (
          <>
            <p className="mt-3 text-center font-display text-2xl">{tHost('over')}</p>
            <Stars count={shiftStars(job, phase.result.score)} />
            <p className="text-center text-lg">{t('result', { points: phase.result.score })}</p>
            {phase.result.coins > 0 && (
              <p className="text-center font-display text-xl text-[#3f8a6a]">
                {t('earned', { coins: phase.result.coins })}
              </p>
            )}
            {phase.result.hasEarnedAll && (
              <p className="mt-1 text-center text-ui-ink/70">{t('allEarned')}</p>
            )}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => onDone(phase.result)}
                className={`${CHOICE_CLASS} bg-ui-accent!`}
              >
                {tHost('back')}
              </button>
            </div>
          </>
        )}

        {phase.step === 'error' && (
          <>
            <p className="mt-3 text-lg">{t('error')}</p>
            <button type="button" onClick={() => onDone(null)} className={`${CHOICE_CLASS} mt-4`}>
              {tHost('back')}
            </button>
          </>
        )}
      </TornPaper>
    </div>
  );
}

// The score line over a board: its points and the mistakes so far.
export function ScoreLine({
  points,
  mistakes,
  limit,
}: {
  points: number;
  mistakes: number;
  limit: number;
}) {
  const t = useTranslations('Shift');
  return (
    <div className="mt-1 flex items-center justify-between gap-3 text-lg">
      <span>
        {t('points')} <span className="font-digits font-bold tabular-nums">{points}</span>
      </span>
      <Mistakes count={mistakes} limit={limit} />
    </div>
  );
}

// Buttons that answer at the touch, rather than on the finger's way up, and to the keyboard.
export function pressHandlers(onPress: () => void) {
  return {
    onPointerDown: (event: { preventDefault: () => void }) => {
      event.preventDefault();
      onPress();
    },
    onClick: (event: { detail: number }) => {
      // Only the keyboard's own presses come through here: a tap already answered.
      if (event.detail === 0) {
        onPress();
      }
    },
  };
}

// The guide, a page at a time: its picture and words, dots for where the reader is, and buttons to
// go back, go on, or start once at the end.
function TipsCarousel({
  tips,
  index,
  nextButton,
  onShow,
  onStart,
  onBack,
}: {
  tips: readonly ShiftTip[];
  index: number;
  nextButton: RefObject<HTMLButtonElement | null>;
  onShow: (index: number) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const t = useTranslations('Shift.tips');
  const tip = tips[index];
  const isLast = index === tips.length - 1;
  return (
    <section aria-roledescription={t('carousel')} aria-label={t('label')} className="mt-2">
      <fieldset
        key={index}
        aria-roledescription={t('slide')}
        aria-label={t('page', { index: index + 1, count: tips.length })}
        className="ui-pop-in m-0 flex min-h-40 min-w-0 flex-col items-center gap-3 rounded-sm border-0 bg-[#efe6d2] px-4 py-4 text-center sm:flex-row sm:text-left"
      >
        {tip.picture && (
          <div
            aria-hidden="true"
            className="flex shrink-0 items-end gap-2.5 rounded-md bg-ui-paper p-2 shadow-[2px_3px_0_var(--ui-shadow)]"
          >
            {tip.picture}
          </div>
        )}
        <div>
          <h3 className="font-display text-lg">{tip.title}</h3>
          <p className="mt-1 text-lg leading-snug">{tip.text}</p>
        </div>
      </fieldset>
      <div aria-hidden="true" className="mt-2 flex justify-center gap-1.5">
        {tips.map(({ title }, dot) => (
          <span
            key={title}
            className={`size-2.5 rounded-full ${dot === index ? 'bg-ui-ink' : 'bg-ui-ink/20'}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <button
          ref={nextButton}
          type="button"
          onClick={() => (isLast ? onStart() : onShow(index + 1))}
          className={`${CHOICE_CLASS} bg-ui-accent!`}
        >
          {isLast ? t('start') : t('next')}
        </button>
        {index > 0 && (
          <button type="button" onClick={() => onShow(index - 1)} className={CHOICE_CLASS}>
            {t('previous')}
          </button>
        )}
        <button type="button" onClick={onBack} className={CHOICE_CLASS}>
          {t('back')}
        </button>
      </div>
    </section>
  );
}
