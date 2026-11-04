'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { PlayableSet } from '@/game/card-sets';
import { type FishedItem, ITEM_COINS, secondsUntilBite } from '@/game/fishing';
import type { Wallet } from '@/game/shop-dialogue';
import type { FishingCatch } from '@/player/progress';
import { BoosterIcon, CoinIcon } from './hud-icons';
import { moveThroughChoices } from './menu-focus';
import type { QuestLine } from './quest-dialog';
import { CHOICE_CLASS, TornPaper } from './shop-dialog';

// How many sparkles twinkle round the treasure box, each starting a little after the last.
const SPARKLE_COUNT = 6;
const SPARKLE_STAGGER_MS = 270;

// Somewhere in the bands on either side of the box and its text, never behind them.
function sparkleSpot() {
  const isLeft = Math.random() < 0.5;
  return {
    left: `${(isLeft ? 4 : 78) + Math.random() * 18}%`,
    top: `${6 + Math.random() * 82}%`,
    size: 0.7 + Math.random() * 0.6,
  };
}

// A four-pointed star that twinkles, then lights up somewhere else.
function Sparkle({ delay }: { delay: number }) {
  const [spot, setSpot] = useState(sparkleSpot);
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      onAnimationIteration={() => setSpot(sparkleSpot())}
      style={{
        left: spot.left,
        top: spot.top,
        width: `${spot.size}rem`,
        animationDelay: `${delay}ms`,
      }}
      className="ui-twinkle absolute aspect-square"
    >
      <path
        d="M10 0 Q11.4 8.6 20 10 Q11.4 11.4 10 20 Q8.6 11.4 0 10 Q8.6 8.6 10 0Z"
        fill="#f3c14b"
      />
    </svg>
  );
}

type Step = 'waiting' | 'biting' | 'reeling' | 'caught';

type Props = {
  sets: readonly PlayableSet[];
  onReelIn: () => Promise<FishingCatch | null>;
  // Says what Lucas answers, and the coins and boosters to show from now on.
  onEnd: (line: QuestLine, wallet?: Wallet) => void;
};

// Lucas's things as they come up, dripping: drawn by us, like everything else.
function ItemPicture({ item }: { item: FishedItem }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 130"
      className="ui-pop-in h-32 drop-shadow-[3px_4px_0_rgb(44_42_53/28%)]"
    >
      {item === 'boat' && (
        <>
          <path d="M100 18 V86" stroke="#7f5530" strokeWidth="5" />
          <path d="M104 22 L150 78 H104Z" fill="#fbf6ea" />
          <path d="M96 30 L62 78 H96Z" fill="#e8645a" />
          <path d="M40 86 H160 L144 112 H58Z" fill="#3a86c8" />
          <path d="M48 96 H152" stroke="#fbf6ea" strokeWidth="4" />
        </>
      )}
      {item === 'sandal' && (
        <>
          <ellipse cx="100" cy="72" rx="74" ry="34" fill="#f3c14b" />
          <ellipse cx="100" cy="70" rx="62" ry="24" fill="#f7d36a" />
          <path d="M70 58 Q100 20 130 58" fill="none" stroke="#e8645a" strokeWidth="12" />
          <circle cx="100" cy="36" r="9" fill="#9a7bd6" />
        </>
      )}
      {item === 'ball' && (
        <>
          <circle cx="100" cy="66" r="50" fill="#fbf6ea" />
          <path d="M100 16 A50 50 0 0 1 150 66 H100Z" fill="#e8645a" />
          <path d="M50 66 A50 50 0 0 0 100 116 V66Z" fill="#3a86c8" />
          <path d="M100 116 A50 50 0 0 0 150 66 H100Z" fill="#f3c14b" />
          <circle cx="100" cy="66" r="10" fill="#fbf6ea" />
        </>
      )}
      {item === 'duck' && (
        <>
          <ellipse cx="96" cy="86" rx="62" ry="30" fill="#f7d36a" />
          <circle cx="132" cy="48" r="28" fill="#f7d36a" />
          <path d="M156 46 L184 52 L156 60Z" fill="#e9a23b" />
          <circle cx="140" cy="42" r="5" fill="#2c2a35" />
          <path d="M60 82 Q84 70 104 84" fill="none" stroke="#e9a23b" strokeWidth="5" />
        </>
      )}
      {item === 'treasure' && (
        <>
          <rect x="36" y="56" width="128" height="60" rx="8" fill="#8a5a35" />
          <path d="M36 62 Q36 22 100 22 Q164 22 164 62Z" fill="#a8743f" />
          <rect x="36" y="56" width="128" height="10" fill="#f3c14b" />
          <rect x="92" y="22" width="16" height="94" fill="#f3c14b" />
          <rect x="88" y="62" width="24" height="22" rx="4" fill="#e0a51f" />
          <circle cx="100" cy="72" r="4" fill="#2c2a35" />
        </>
      )}
      {/* A few drops of the lake, still falling off it. */}
      {[
        [40, 30],
        [168, 38],
        [56, 118],
      ].map(([dropX, dropY]) => (
        <path key={dropX} d={`M${dropX} ${dropY} q6 10 0 14 q-6 -4 0 -14Z`} fill="#8cc3e6" />
      ))}
    </svg>
  );
}

// What comes up is only drawn once the line comes up, so that backing out before that changes
// nothing.
export function FishingDialog({ sets, onReelIn, onEnd }: Props) {
  const t = useTranslations('Quest.fishing');
  const dialog = useRef<HTMLDialogElement>(null);
  const mainButton = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>('waiting');
  const [caught, setCaught] = useState<FishingCatch | null>(null);
  const item = caught?.item ?? null;
  const setName = sets.find(({ id }) => id === caught?.boosterSetId)?.name;

  useEffect(() => {
    dialog.current?.showModal();
    mainButton.current?.focus();
    const bite = setTimeout(() => setStep('biting'), secondsUntilBite() * 1000);
    return () => clearTimeout(bite);
  }, []);

  const reelIn = async () => {
    setStep('reeling');
    const answer = await onReelIn();
    if (!answer) {
      onEnd('unavailable');
    } else if (!answer.item) {
      onEnd('alreadyDone', answer.wallet);
    } else {
      setCaught(answer);
      setStep('caught');
    }
  };

  const giveBack = () => {
    if (caught) {
      onEnd(caught.boosterSetId ? 'rewardedShiny' : 'rewarded', caught.wallet);
    }
  };

  const pressMain = () => {
    if (step === 'biting') {
      reelIn();
    } else if (step === 'caught') {
      giveBack();
    }
  };

  const mainLabel = {
    waiting: t('waiting'),
    biting: t('reel'),
    reeling: t('reeling'),
    caught: t('giveToBoy'),
  }[step];

  return (
    <dialog
      ref={dialog}
      aria-labelledby="fishing-title"
      onClose={() => (caught ? giveBack() : onEnd('failed'))}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto w-[min(28rem,calc(100%-1rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="px-4 pt-5 pb-5">
        <h2 id="fishing-title" className="font-display text-xl">
          {t('title')}
        </h2>
        <div
          className={`relative mt-3 flex h-56 items-center justify-center overflow-hidden rounded-md shadow-[3px_4px_0_var(--ui-shadow)] transition-colors duration-500 ${
            item === 'treasure' ? 'bg-[#fff3c4]' : 'bg-[linear-gradient(#8cc3e6,#5fa8d6)]'
          }`}
        >
          {/* Ripples on the water, and reeds on its edge. */}
          {item !== 'treasure' && (
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_30px_5px_at_30%_40%,rgb(255_255_255/45%)_60%,transparent_62%),radial-gradient(ellipse_40px_6px_at_70%_70%,rgb(255_255_255/40%)_60%,transparent_62%),radial-gradient(ellipse_24px_4px_at_20%_80%,rgb(255_255_255/40%)_60%,transparent_62%)]"
            />
          )}
          {item ? (
            <div className="relative flex flex-col items-center text-center">
              <ItemPicture item={item} />
              <p className="mt-1 font-display text-xl">{t(`items.${item}`)}</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg">
                {setName ? <BoosterIcon /> : <CoinIcon />}
                {setName ? t('booster', { set: setName }) : t('coins', { count: ITEM_COINS })}
              </p>
            </div>
          ) : (
            <>
              <span
                aria-hidden="true"
                className="absolute top-0 left-1/2 h-1/2 w-0.5 bg-[#2c2a35]/60"
              />
              <span
                role="img"
                aria-label={step === 'waiting' ? t('floatResting') : t('floatBiting')}
                className={`relative size-8 rounded-full border-3 border-ui-paper bg-[linear-gradient(#e8453a_50%,#fbf6ea_50%)] shadow-[2px_3px_0_rgb(44_42_53/28%)] ${
                  step === 'waiting' ? 'ui-bob' : 'translate-y-3 animate-bounce'
                }`}
              />
              {step !== 'waiting' && (
                <span
                  aria-hidden="true"
                  className="absolute size-20 animate-ping rounded-full border-4 border-white/70"
                />
              )}
            </>
          )}
          {item === 'treasure' &&
            Array.from({ length: SPARKLE_COUNT }, (_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: the sparkles are all alike.
              <Sparkle key={index} delay={index * SPARKLE_STAGGER_MS} />
            ))}
        </div>
        <form method="dialog" className="mt-4 flex flex-wrap gap-2.5">
          <button
            ref={mainButton}
            type="button"
            // Not `disabled`, which would take the focus away from the keyboard.
            aria-disabled={step === 'waiting' || step === 'reeling'}
            aria-live="polite"
            onClick={pressMain}
            // Kept on one line, so that the buttons don't jump when its text changes.
            className={`${CHOICE_CLASS} whitespace-nowrap ${step === 'biting' || step === 'caught' ? 'bg-ui-stamp text-ui-paper' : ''}`}
          >
            {mainLabel}
          </button>
          {!item && step !== 'reeling' && (
            <button type="submit" className={CHOICE_CLASS}>
              {t('giveUp')}
            </button>
          )}
        </form>
      </TornPaper>
    </dialog>
  );
}
