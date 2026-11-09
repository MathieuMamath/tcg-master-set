'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { ballNumber, JACKPOT_COINS, PRIZE_COINS, type RaffleOutcome } from '@/game/quests/raffle';
import type { RaffleDraw } from '@/player/quests/raffle';
import { CoinIcon } from '../hud/hud-icons';
import { moveThroughChoices } from '../menu-focus';
import { CHOICE_CLASS, TornPaper } from '../shop/shop-dialog';
import { SPARKLE_COUNT, SPARKLE_STAGGER_MS, Sparkle } from './fishing-dialog';
import type { QuestLine } from './quest-dialog';

// The drum turns at least this long, even when the server answers at once.
const SPIN_MS = 1800;

const BALL_COLORS: Record<RaffleOutcome, { fill: string; ink: string }> = {
  jackpot: { fill: '#f3c14b', ink: '#7a5310' },
  prize: { fill: '#d0443a', ink: '#fbf1e1' },
  none: { fill: '#fbf1e1', ink: '#2c2a35' },
};

const LINES: Record<RaffleOutcome, QuestLine> = {
  jackpot: 'rewardedShiny',
  prize: 'rewarded',
  none: 'lost',
};

type Step = 'ready' | 'spinning' | 'result';

// The wire drum with its balls, turning while the ball is drawn.
function Drum({ isSpinning }: { isSpinning: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 160" className="h-40">
      <path d="M60 150 L82 80 M140 150 L118 80" stroke="#7f5530" strokeWidth="8" />
      <g
        className={isSpinning ? 'animate-spin [animation-duration:450ms]' : ''}
        style={{ transformOrigin: '100px 80px', transformBox: 'view-box' }}
      >
        <polygon points="160,80 130,132 70,132 40,80 70,28 130,28" fill="#cfe3f2" />
        {[
          [80, 100, '#fbf1e1'],
          [104, 112, '#d0443a'],
          [126, 96, '#fbf1e1'],
          [96, 84, '#f3c14b'],
          [118, 70, '#fbf1e1'],
          [76, 66, '#fbf1e1'],
          [104, 52, '#fbf1e1'],
        ].map(([cx, cy, fill]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="10" fill={fill as string} />
        ))}
        <polygon
          points="160,80 130,132 70,132 40,80 70,28 130,28"
          fill="none"
          stroke="#9a98a6"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M70 28 V132 M90 28 V132 M110 28 V132 M130 28 V132"
          stroke="#b8b6c2"
          strokeWidth="2.5"
        />
        <circle cx="100" cy="80" r="7" fill="#f3c14b" />
      </g>
      <path d="M160 80 L184 56" stroke="#7f5530" strokeWidth="6" strokeLinecap="round" />
      <circle cx="186" cy="54" r="8" fill="#d0443a" />
    </svg>
  );
}

type Props = {
  onDraw: () => Promise<RaffleDraw | null>;
  // Says what Bérénice answers, and the coins to show from now on. Null leaves without a word.
  onEnd: (line: QuestLine | null, draw?: RaffleDraw) => void;
};

// Nothing is drawn until the crank is turned: then the server draws the ball, which this only shows.
export function RaffleDialog({ onDraw, onEnd }: Props) {
  const t = useTranslations('Quest.raffle');
  const dialog = useRef<HTMLDialogElement>(null);
  const mainButton = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>('ready');
  const [draw, setDraw] = useState<RaffleDraw | null>(null);
  const [number] = useState(() => ballNumber());

  useEffect(() => {
    dialog.current?.showModal();
    mainButton.current?.focus();
  }, []);

  useEffect(() => {
    if (step === 'result') {
      mainButton.current?.focus();
    }
  }, [step]);

  const spin = async () => {
    setStep('spinning');
    const [answer] = await Promise.all([
      onDraw(),
      new Promise((resolve) => setTimeout(resolve, SPIN_MS)),
    ]);
    if (!answer) {
      onEnd('unavailable');
    } else if (!answer.hasDrawn) {
      onEnd('alreadyDone', answer);
    } else {
      setDraw(answer);
      setStep('result');
    }
  };

  const showBerenice = () => {
    if (draw?.hasDrawn) {
      onEnd(LINES[draw.outcome], draw);
    }
  };

  const outcome = draw?.hasDrawn ? draw.outcome : null;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="raffle-title"
      // Closing before the crank is turned draws nothing.
      onClose={() => (outcome ? showBerenice() : onEnd(null))}
      onCancel={(event) => {
        if (step === 'spinning') {
          event.preventDefault();
        }
      }}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto w-[min(26rem,calc(100%-1rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="px-4 pt-5 pb-5">
        <h2 id="raffle-title" className="font-display text-xl">
          {t('title')}
        </h2>
        <ul className="mt-1 text-lg">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3.5 rounded-full bg-[#f3c14b]" />
            {t('jackpotOdds', { count: JACKPOT_COINS })}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3.5 rounded-full bg-[#d0443a]" />
            {t('prizeOdds', { count: PRIZE_COINS })}
          </li>
        </ul>
        <div
          // The jackpot turns the panel plum, like Bérénice's hat, for its gold to shine.
          className={`relative mt-2 flex h-56 flex-col items-center justify-center overflow-hidden rounded-md shadow-[3px_4px_0_var(--ui-shadow)] transition-colors duration-500 ${
            outcome === 'jackpot'
              ? 'bg-[linear-gradient(#efe4f7,#d9c4ec)]'
              : 'bg-[linear-gradient(#fff3c4,#f6dd94)]'
          }`}
        >
          {outcome ? (
            <div className="ui-pop-in flex flex-col items-center gap-2 text-center">
              <svg
                aria-hidden="true"
                viewBox="0 0 80 80"
                className="size-24 drop-shadow-[3px_4px_0_rgb(44_42_53/28%)]"
              >
                <circle cx="40" cy="40" r="38" fill="#fffdf6" />
                <circle cx="40" cy="40" r="33" fill={BALL_COLORS[outcome].fill} />
                <circle cx="40" cy="40" r="17" fill="#fffdf6" />
                <text
                  x="40"
                  y="41"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="Courier Prime, monospace"
                  fontWeight="700"
                  fontSize="18"
                  fill={outcome === 'none' ? BALL_COLORS.none.ink : '#2c2a35'}
                >
                  {number}
                </text>
                <ellipse cx="28" cy="24" rx="7" ry="4" fill="#fff" opacity="0.5" />
              </svg>
              <p aria-live="polite" className="font-display text-xl">
                {t(`results.${outcome}`)}
              </p>
              {draw?.hasDrawn && draw.coins > 0 && (
                <p className="flex items-center gap-1.5 text-lg">
                  <CoinIcon />
                  {t('coins', { count: draw.coins })}
                </p>
              )}
            </div>
          ) : (
            <Drum isSpinning={step === 'spinning'} />
          )}
          {outcome === 'jackpot' &&
            Array.from({ length: SPARKLE_COUNT }, (_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: the sparkles are all alike.
              <Sparkle key={index} delay={index * SPARKLE_STAGGER_MS} />
            ))}
        </div>
        <form method="dialog" className="mt-4 flex flex-wrap gap-2.5">
          {outcome ? (
            <button
              ref={mainButton}
              type="submit"
              className={`${CHOICE_CLASS} bg-ui-stamp! text-ui-paper`}
            >
              {t('showBerenice')}
            </button>
          ) : (
            <>
              <button
                ref={mainButton}
                type="button"
                // Not `disabled`, which would take the focus away from the keyboard.
                aria-disabled={step === 'spinning'}
                aria-live="polite"
                onClick={() => step === 'ready' && spin()}
                className={`${CHOICE_CLASS} whitespace-nowrap bg-ui-stamp! text-ui-paper`}
              >
                {step === 'spinning' ? t('spinning') : t('spin')}
              </button>
              {step === 'ready' && (
                <button type="submit" className={CHOICE_CLASS}>
                  {t('later')}
                </button>
              )}
            </>
          )}
        </form>
      </TornPaper>
    </dialog>
  );
}
