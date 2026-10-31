'use client';

import { useTranslations } from 'next-intl';
import { type MouseEvent, type PointerEvent, useEffect, useRef, useState } from 'react';
import type { OpenedCard } from '@/cards/booster-pool';
import { isTearComplete, tearProgress } from '@/game/booster';

const TEAR_ANIMATION_MILLISECONDS = 450;

export type Opening =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; setName: string; cards: OpenedCard[] };

function CardBack() {
  return (
    <div className="flex size-full items-center justify-center rounded-[4.5%/3.2%] border-8 border-ui-paper bg-ui-ink">
      <div className="flex aspect-square w-3/5 rotate-45 items-center justify-center rounded-2xl border-4 border-ui-accent">
        <div className="size-1/2 rounded-full bg-ui-accent" />
      </div>
    </div>
  );
}

function CardFace({ card, quality }: { card: OpenedCard; quality: 'high' | 'low' }) {
  if (!card.imageUrl) {
    return (
      <div className="flex size-full items-center justify-center rounded-[4.5%/3.2%] border-8 border-ui-accent bg-ui-paper p-2 text-center text-ui-ink">
        {card.name}
      </div>
    );
  }
  return (
    // The images come from the card catalogue's own server, in its optimised sizes.
    // biome-ignore lint/performance/noImgElement: next/image would only proxy them again.
    <img
      src={`${card.imageUrl}/${quality}.webp`}
      alt={card.name}
      draggable={false}
      className="size-full rounded-[4.5%/3.2%] object-cover"
    />
  );
}

function SealedPack({ setName, onTorn }: { setName: string; onTorn: () => void }) {
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
        className="ui-pop-in relative aspect-[5/7] w-[min(calc(100vw-2rem),42vh,20rem)] cursor-grab touch-none select-none outline-none active:cursor-grabbing"
      >
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border-4 border-ui-ink bg-gradient-to-br from-[#7b5ea7] via-[#2e86ab] to-[#3bb273] px-4 text-center text-ui-paper shadow-[0_8px_0_var(--ui-ink)]">
          <span className="ui-shine absolute inset-0" />
          <span
            aria-hidden="true"
            className="flex size-24 rotate-45 items-center justify-center rounded-2xl border-4 border-ui-paper"
          >
            <span className="size-10 rounded-full bg-ui-accent" />
          </span>
          <span className="relative text-2xl font-semibold">{setName}</span>
        </span>
        <span
          aria-hidden="true"
          style={{
            transform: `rotate(${progress * -8}deg) translateY(${isTorn ? '-180%' : `${progress * -8}px`})`,
            opacity: isTorn ? 0 : 1,
          }}
          className="absolute inset-x-0 top-0 h-[13%] origin-right rounded-t-xl border-4 border-b-0 border-ui-ink bg-ui-accent transition-[transform,opacity] duration-300"
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
      <p className="text-center text-lg text-ui-paper">{t('tearHint')}</p>
    </div>
  );
}

function Reveal({ cards, onFinished }: { cards: OpenedCard[]; onFinished: () => void }) {
  const t = useTranslations('Booster');
  const [revealed, setRevealed] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const current = revealed > 0 ? cards[revealed - 1] : null;
  const isLast = revealed === cards.length;

  // Loaded ahead of time, so that each card appears the moment it's revealed.
  useEffect(() => {
    button.current?.focus();
    for (const { imageUrl } of cards) {
      if (imageUrl) {
        new Image().src = `${imageUrl}/high.webp`;
      }
    }
  }, [cards]);

  const label = isLast ? t('seeAll') : t('reveal');

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <p aria-live="polite" className="text-lg font-semibold text-ui-paper">
        {current ? current.name : t('readyToReveal')}
      </p>
      <button
        ref={button}
        type="button"
        aria-label={label}
        onClick={() => (isLast ? onFinished() : setRevealed(revealed + 1))}
        className="aspect-[5/7] h-[min(62vh,30rem)] max-w-full cursor-pointer outline-none [perspective:60rem]"
      >
        <span
          key={revealed}
          className={`ui-card-flip relative block size-full rounded-[4.5%/3.2%] ${
            current && current.variant !== 'normal' ? 'ui-card-special' : ''
          }`}
        >
          {current ? <CardFace card={current} quality="high" /> : <CardBack />}
          {current && current.variant !== 'normal' && (
            <span className="ui-shine pointer-events-none absolute inset-0 rounded-[4.5%/3.2%]" />
          )}
        </span>
      </button>
      <p className="text-ui-paper">
        {current?.rarity && <span className="font-semibold">{current.rarity} · </span>}
        {t('progress', { current: revealed, total: cards.length })}
      </p>
      <p className="text-sm text-ui-paper/70">{label}</p>
    </div>
  );
}

function Summary({ cards, onClose }: { cards: OpenedCard[]; onClose: () => void }) {
  const t = useTranslations('Booster');

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold text-ui-paper">{t('summaryTitle')}</h2>
      <ul className="grid w-full max-w-3xl grid-cols-5 gap-1.5 sm:gap-2">
        {cards.map((card) => (
          <li key={card.id} className="ui-pop-in aspect-[5/7]">
            <CardFace card={card} quality="low" />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer rounded-full border-4 border-ui-ink bg-ui-accent px-6 py-1.5 text-lg font-semibold text-ui-ink shadow-[0_4px_0_var(--ui-ink)]"
      >
        {t('done')}
      </button>
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
          {step === 'pack' && (
            <SealedPack setName={opening.setName} onTorn={() => setStep('reveal')} />
          )}
          {step === 'reveal' && (
            <Reveal cards={opening.cards} onFinished={() => setStep('summary')} />
          )}
          {step === 'summary' && <Summary cards={opening.cards} onClose={onClose} />}
        </div>
      )}
    </dialog>
  );
}
