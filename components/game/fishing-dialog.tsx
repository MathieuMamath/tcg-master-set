'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { PlayableSet } from '@/game/card-sets';
import { FISH_COINS, type Fish, secondsUntilBite } from '@/game/fishing';
import type { Wallet } from '@/game/shop-dialogue';
import type { FishingCatch } from '@/player/progress';
import { moveThroughChoices } from './menu-focus';
import type { QuestLine } from './quest-dialog';
import { CHOICE_CLASS } from './shop-dialog';

const FISH_COLORS: Record<Fish, { body: string; belly: string; fin: string }> = {
  common: { body: '#e4572e', belly: '#f7d7b5', fin: '#f2efe6' },
  shiny: { body: '#f5c542', belly: '#fff2b0', fin: '#e0a51f' },
};
const SPARKLES = [
  'top-4 left-8',
  'top-10 right-10',
  'bottom-6 left-14',
  'bottom-10 right-6',
  'top-2 right-24',
];

type Step = 'waiting' | 'biting' | 'reeling' | 'caught';

type Props = {
  sets: readonly PlayableSet[];
  onReelIn: () => Promise<FishingCatch | null>;
  // Says what the little boy answers, and the coins and boosters to show from now on.
  onEnd: (line: QuestLine, wallet?: Wallet) => void;
};

function FishPicture({ fish }: { fish: Fish }) {
  const { body, belly, fin } = FISH_COLORS[fish];
  return (
    <svg aria-hidden="true" viewBox="0 0 200 130" className="ui-pop-in h-32">
      <path d="M150 65 195 25V105Z" fill={fin} stroke="#1b1730" strokeWidth="4" />
      <path d="M85 25 110 2 125 30Z" fill={fin} stroke="#1b1730" strokeWidth="4" />
      <ellipse cx="90" cy="65" rx="72" ry="48" fill={body} stroke="#1b1730" strokeWidth="4" />
      <path d="M32 92C60 118 125 118 150 86 110 98 65 100 32 92Z" fill={belly} />
      <path d="M92 75 118 88 96 100Z" fill={fin} stroke="#1b1730" strokeWidth="3" />
      <circle cx="45" cy="50" r="14" fill="#fcfcfc" stroke="#1b1730" strokeWidth="3" />
      <circle cx="42" cy="50" r="5" fill="#1b1730" />
      <path
        d="M22 78C8 82 4 95 8 108M28 84C20 92 20 104 26 114"
        fill="none"
        stroke={fin}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// The fish is only drawn once the line comes up, so that backing out before that changes nothing.
export function FishingDialog({ sets, onReelIn, onEnd }: Props) {
  const t = useTranslations('Quest.fishing');
  const dialog = useRef<HTMLDialogElement>(null);
  const mainButton = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>('waiting');
  const [caught, setCaught] = useState<FishingCatch | null>(null);
  const fish = caught?.fish ?? null;
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
    } else if (!answer.fish) {
      onEnd('alreadyDone', answer.wallet);
    } else {
      setCaught(answer);
      setStep('caught');
    }
  };

  const giveFish = () => {
    if (caught) {
      onEnd(caught.boosterSetId ? 'rewardedShiny' : 'rewarded', caught.wallet);
    }
  };

  const pressMain = () => {
    if (step === 'biting') {
      reelIn();
    } else if (step === 'caught') {
      giveFish();
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
      onClose={() => (caught ? giveFish() : onEnd('failed'))}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden ui-scrap font-game text-ui-ink backdrop:bg-black/40"
    >
      <h2 id="fishing-title" className="px-4 pt-2 font-display text-lg">
        {t('title')}
      </h2>
      <div
        className={`relative mt-2 flex h-52 items-center justify-center overflow-hidden transition-colors duration-500 ${
          fish === 'shiny' ? 'bg-[#fff3c4]' : 'bg-[#4aa6d6]'
        }`}
      >
        {fish ? (
          <div className="flex flex-col items-center text-center">
            <FishPicture fish={fish} />
            <p className={`font-semibold ${fish === 'shiny' ? 'text-2xl' : 'text-xl text-white'}`}>
              {fish === 'shiny' ? t('shinyFish') : t('commonFish')}
            </p>
            <p className={`font-semibold ${fish === 'shiny' ? '' : 'text-white'}`}>
              {setName ? t('booster', { set: setName }) : t('coins', { count: FISH_COINS })}
            </p>
          </div>
        ) : (
          <>
            <span aria-hidden="true" className="absolute top-0 left-1/2 h-1/2 w-0.5 bg-[#f7f3e8]" />
            <span
              role="img"
              aria-label={step === 'waiting' ? t('floatResting') : t('floatBiting')}
              className={`relative size-8 rounded-full border-3 border-ui-ink bg-[linear-gradient(#e4572e_50%,#fcfcfc_50%)] ${
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
        {fish === 'shiny' &&
          SPARKLES.map((place) => (
            <span
              key={place}
              aria-hidden="true"
              className={`absolute size-3 animate-ping rounded-full bg-[#f5c542] ${place}`}
            />
          ))}
      </div>
      <form method="dialog" className="p-3">
        <button
          ref={mainButton}
          type="button"
          // Not `disabled`, which would take the focus away from the keyboard.
          aria-disabled={step === 'waiting' || step === 'reeling'}
          aria-live="polite"
          onClick={pressMain}
          className={CHOICE_CLASS}
        >
          {mainLabel}
        </button>
        {!fish && step !== 'reeling' && (
          <button type="submit" className={CHOICE_CLASS}>
            {t('giveUp')}
          </button>
        )}
      </form>
    </dialog>
  );
}
