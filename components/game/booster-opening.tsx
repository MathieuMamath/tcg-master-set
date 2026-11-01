'use client';

import { useTranslations } from 'next-intl';
import { type MouseEvent, type PointerEvent, useEffect, useRef, useState } from 'react';
import type { OpenedCard } from '@/cards/booster-pool';
import { isTearComplete, tearProgress } from '@/game/booster';
import type { SetId } from '@/game/card-sets';
import { CardBack } from './card-back';
import { CardPicture } from './card-picture';
import { moveThroughChoices } from './menu-focus';
import { PackBody, packCrimpStyle } from './pack-art';
import { TiltCard } from './tilt-card';

const TEAR_ANIMATION_MILLISECONDS = 450;

export type Opening = { setId: SetId } & (
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      setName: string;
      logoUrl: string | null;
      cards: OpenedCard[];
      isGodPack: boolean;
    }
);

function isSpecial(card: OpenedCard) {
  return card.variant !== 'normal';
}

function SealedPack({
  setId,
  setName,
  logoUrl,
  onTorn,
}: {
  setId: SetId;
  setName: string;
  logoUrl: string | null;
  onTorn: () => void;
}) {
  const t = useTranslations('Booster');
  const drag = useRef<{ startX: number; width: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [isTorn, setIsTorn] = useState(false);

  const tear = () => {
    if (isTorn) {
      return;
    }
    setIsTorn(true);
    setProgress(1);
    setTimeout(onTorn, TEAR_ANIMATION_MILLISECONDS);
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startX: event.clientX,
      width: event.currentTarget.getBoundingClientRect().width,
    };
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!drag.current || isTorn) {
      return;
    }
    const next = tearProgress(drag.current.startX, event.clientX, drag.current.width);
    setProgress((current) => Math.max(current, next));
    if (isTearComplete(next)) {
      tear();
    }
  };
  const onPointerEnd = () => {
    drag.current = null;
    if (!isTorn) {
      setProgress(0);
    }
  };
  // Only the keyboard produces a click with no pointer detail. It opens the pack directly.
  const onClick = (event: MouseEvent) => {
    if (event.detail === 0) {
      tear();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        type="button"
        aria-label={t('tearKeyboard')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={onClick}
        style={packCrimpStyle(setId)}
        className="ui-pop-in relative aspect-[5/7.6] w-[min(calc(100vw-2rem),47vh,22.5rem)] cursor-grab touch-none select-none outline-offset-4 active:cursor-grabbing"
      >
        <PackBody setId={setId} setName={setName} logoUrl={logoUrl} />
        <span
          aria-hidden="true"
          style={{
            transform: `rotate(${progress * -8}deg) translateY(${isTorn ? '-180%' : `${progress * -8}px`})`,
            opacity: isTorn ? 0 : 1,
          }}
          className="ui-pack-crimp absolute inset-x-0 top-0 h-[13%] origin-right rounded-t-md border-4 border-b-0 border-ui-ink transition-[transform,opacity] duration-300"
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-1 top-[13%] border-t-4 border-dashed border-ui-paper"
        />
        <span
          aria-hidden="true"
          className="absolute top-[13%] h-1 bg-ui-ink"
          style={{ left: 0, width: `${progress * 100}%` }}
        />
        <span
          aria-hidden="true"
          style={{ left: `${progress * 100}%` }}
          className="absolute top-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full border-3 border-ui-ink bg-ui-paper px-1.5 text-lg text-ui-ink"
        >
          ✂
        </span>
      </button>
      <div className="text-center text-ui-paper">
        <p className="text-lg">{t('tearHint')}</p>
        <p className="pointer-coarse:hidden">{t('tearKeyHint')}</p>
      </div>
    </div>
  );
}

function GodPackBanner() {
  const t = useTranslations('Booster');

  return (
    <p className="ui-god-pack-banner rounded-full border-4 border-ui-ink bg-ui-accent px-5 py-0.5 text-2xl font-bold text-ui-ink shadow-[0_4px_0_var(--ui-ink)]">
      {t('godPack')}
    </p>
  );
}

function Reveal({
  cards,
  isGodPack,
  onFinished,
}: {
  cards: OpenedCard[];
  isGodPack: boolean;
  onFinished: () => void;
}) {
  const t = useTranslations('Booster');
  const [revealed, setRevealed] = useState(0);
  const current = revealed > 0 ? cards[revealed - 1] : null;
  const isLast = revealed === cards.length;

  // Loaded ahead of time, so that each card appears the moment it's revealed.
  useEffect(() => {
    for (const { imageUrl } of cards) {
      if (imageUrl) {
        new Image().src = `${imageUrl}/high.webp`;
      }
    }
  }, [cards]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-3">
      {isGodPack && <GodPackBanner />}
      <p aria-live="polite" className="text-lg font-semibold text-ui-paper">
        {current ? current.name : t('readyToReveal')}
      </p>
      <div
        className={`aspect-[5/7] w-[min(100%,44vh,21.4rem)] [perspective:60rem] ${
          isGodPack ? '[@media(max-height:30rem)]:w-[34vh]' : ''
        }`}
      >
        <div key={revealed} className="ui-card-flip size-full">
          <TiltCard isSpecial={current !== null && isSpecial(current)}>
            {current ? (
              <CardPicture name={current.name} imageUrl={current.imageUrl} quality="high" />
            ) : (
              <CardBack />
            )}
          </TiltCard>
        </div>
      </div>
      <p className="text-ui-paper">
        {current?.rarity && <span className="font-semibold">{current.rarity} · </span>}
        {t('progress', { current: revealed, total: cards.length })}
      </p>
      <button
        type="button"
        onClick={() => (isLast ? onFinished() : setRevealed(revealed + 1))}
        className="cursor-pointer rounded-full border-4 border-ui-ink bg-ui-accent px-6 py-1.5 text-lg font-semibold text-ui-ink shadow-[0_4px_0_var(--ui-ink)]"
      >
        {isLast ? t('seeAll') : t('reveal')}
      </button>
    </div>
  );
}

function EnlargedCard({ card, onClose }: { card: OpenedCard; onClose: () => void }) {
  const t = useTranslations('Booster');
  const back = useRef<HTMLButtonElement>(null);

  // Read while rendering, because the card behind loses the focus once this appears.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  // The focus goes back to the card this one enlarges.
  useEffect(() => {
    back.current?.focus();
    return () => opener?.focus();
  }, [opener]);

  // Escape goes back to the summary first, rather than closing the whole opening.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ui-ink p-4">
      <div className="ui-pop-in aspect-[5/7] w-[min(100%,50vh,24rem)]">
        <TiltCard isSpecial={isSpecial(card)}>
          <CardPicture name={card.name} imageUrl={card.imageUrl} quality="high" />
        </TiltCard>
      </div>
      <p className="text-center text-lg font-semibold text-ui-paper">
        {card.name}
        {card.rarity && ` · ${card.rarity}`}
      </p>
      <button
        ref={back}
        type="button"
        onClick={onClose}
        className="cursor-pointer rounded-full border-4 border-ui-ink bg-ui-accent px-6 py-1.5 text-lg font-semibold text-ui-ink shadow-[0_4px_0_var(--ui-ink)]"
      >
        {t('back')}
      </button>
    </div>
  );
}

function Summary({
  cards,
  isGodPack,
  onClose,
}: {
  cards: OpenedCard[];
  isGodPack: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('Booster');
  const [enlarged, setEnlarged] = useState<OpenedCard | null>(null);

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4">
      {isGodPack && <GodPackBanner />}
      <h2 className="text-2xl font-semibold text-ui-paper">{t('summaryTitle')}</h2>
      <ul inert={enlarged !== null} className="grid w-full max-w-3xl grid-cols-5 gap-1.5 sm:gap-2">
        {cards.map((card) => (
          <li key={card.id} className="ui-pop-in aspect-[5/7]">
            <button
              type="button"
              aria-label={t('enlargeCard', { name: card.name })}
              onClick={() => setEnlarged(card)}
              className={`relative block size-full cursor-pointer rounded-[4.5%/3.2%] outline-offset-2 ${
                isSpecial(card) ? 'shadow-[0_0_0.9rem_0.15rem_var(--ui-accent)]' : ''
              }`}
            >
              <CardPicture name={card.name} imageUrl={card.imageUrl} quality="low" />
              {isSpecial(card) && (
                <span className="ui-shine pointer-events-none absolute inset-0 rounded-[4.5%/3.2%]" />
              )}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        inert={enlarged !== null}
        onClick={onClose}
        className="cursor-pointer rounded-full border-4 border-ui-ink bg-ui-accent px-6 py-1.5 text-lg font-semibold text-ui-ink shadow-[0_4px_0_var(--ui-ink)]"
      >
        {t('done')}
      </button>
      {enlarged && <EnlargedCard card={enlarged} onClose={() => setEnlarged(null)} />}
    </div>
  );
}

type Props = {
  opening: Opening;
  onRetry: () => void;
  onClose: () => void;
};

export function BoosterOpening({ opening, onRetry, onClose }: Props) {
  const t = useTranslations('Booster');
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<'pack' | 'reveal' | 'summary'>('pack');

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // Each screen replaces the button that had the focus, and the next one is ready to be pressed.
  // biome-ignore lint/correctness/useExhaustiveDependencies: these are what change the screen.
  useEffect(() => {
    dialog.current?.querySelector('button')?.focus();
  }, [opening.status, step]);

  const canLeave = opening.status === 'error' || step === 'summary';

  return (
    <dialog
      ref={dialog}
      aria-label={t('title')}
      onCancel={(event) => {
        // A pack that has been paid for can't be abandoned halfway.
        if (!canLeave) {
          event.preventDefault();
        }
      }}
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="m-0 size-full max-h-none max-w-none bg-ui-ink/95 p-4 font-game backdrop:bg-transparent"
    >
      {opening.status === 'loading' && (
        <div className="flex h-full items-center justify-center text-xl text-ui-paper">
          {t('loading')}
        </div>
      )}
      {opening.status === 'error' && (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-ui-paper">
          <p className="max-w-sm text-xl">{t('error')}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="cursor-pointer rounded-full border-4 border-ui-ink bg-ui-accent px-5 py-1.5 font-semibold text-ui-ink"
            >
              {t('retry')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full border-4 border-ui-paper px-5 py-1.5 font-semibold"
            >
              {t('back')}
            </button>
          </div>
        </div>
      )}
      {opening.status === 'ready' && (
        <div className="flex h-full items-center justify-center">
          {opening.isGodPack && step !== 'pack' && (
            <div
              aria-hidden="true"
              className="ui-god-pack-glow pointer-events-none fixed inset-0"
            />
          )}
          {step === 'pack' && (
            <SealedPack
              setId={opening.setId}
              setName={opening.setName}
              logoUrl={opening.logoUrl}
              onTorn={() => setStep('reveal')}
            />
          )}
          {step === 'reveal' && (
            <Reveal
              cards={opening.cards}
              isGodPack={opening.isGodPack}
              onFinished={() => setStep('summary')}
            />
          )}
          {step === 'summary' && (
            <Summary cards={opening.cards} isGodPack={opening.isGodPack} onClose={onClose} />
          )}
        </div>
      )}
    </dialog>
  );
}
