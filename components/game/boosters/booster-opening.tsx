'use client';

import { useTranslations } from 'next-intl';
import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { RevealedCard } from '@/cards/booster-pool';
import { isTearComplete, tearProgress } from '@/game/cards/booster';
import type { BoosterLotSize } from '@/game/cards/booster-lots';
import type { SetId } from '@/game/cards/card-sets';
import { cardFoil } from '@/game/cards/foil';
import { type PullTier, packTier } from '@/game/cards/pull-tier';
import type { OpenedPack } from '@/player/shop';
import { moveThroughChoices } from '../menu-focus';
import { CardBack } from './card-back';
import { CardFoil } from './card-foil';
import { CardPicture, ENLARGED_CARD_CLASS } from './card-picture';
import { PackBody, PackEdge, packEdgeStyle } from './pack-art';
import { PullRays, PullScene, tierColor, tierColors } from './pull-scene';
import { SparksCanvas, useSparks } from './pull-sparks';
import { TiltCard } from './tilt-card';

const TEAR_ANIMATION_MILLISECONDS = 450;
// Clockwise, so that the left end rises: the cut goes from left to right.
const LIFTED_EDGE_DEGREES = 14;
const TORN_EDGE_DEGREES = 20;
const FIRST_TEASED_TIER = 2;
const FIRST_RAYS_TIER = 2;
const FIRST_SHAKING_TIER = 3;
const FIRST_FLASHING_TIER = 3;

// Sealed until the player cuts it: only then does the server take the booster and draw the cards,
// so that cancelling costs nothing and can't be used to draw again.
// A booster, or a lot of five or ten of one set, from the bag to its cards.
export type Opening = {
  setId: SetId;
  setName: string;
  logoUrl: string | null;
  size: BoosterLotSize;
} & (
  | { status: 'sealed' }
  | { status: 'cutting' }
  | { status: 'error' }
  | { status: 'ready'; packs: OpenedPack[] }
);

// How many boosters a lot holds, on a tag pinned to its pack.
function LotTag({ size }: { size: BoosterLotSize }) {
  const t = useTranslations('Booster');
  return size > 1 ? (
    <span className="absolute -top-3 -right-4 z-10 rotate-[5deg] ui-scrap bg-ui-accent px-2.5 py-0.5 text-xl font-semibold text-ui-ink">
      <span aria-hidden="true">×{size}</span>
      <span className="sr-only">{t('lotTag', { count: size })}</span>
    </span>
  ) : null;
}

// Each card with a key of its own: a lot can hold the same card twice, told apart by how many
// times it came before.
function keyedCards(cards: readonly RevealedCard[]) {
  const seen = new Map<string, number>();
  return cards.map((card) => {
    const slot = `${card.id}-${card.variant}`;
    const times = seen.get(slot) ?? 0;
    seen.set(slot, times + 1);
    return { card, key: `${slot}-${times}` };
  });
}

// Every card of a lot, the best first, then the new ones before the duplicates.
function lotCards(packs: readonly OpenedPack[]): RevealedCard[] {
  return packs
    .flatMap(({ cards }) => cards)
    .map((card, order) => ({ card, order }))
    .sort(
      (a, b) =>
        b.card.tier - a.card.tier ||
        Number(b.card.isNew) - Number(a.card.isNew) ||
        a.order - b.order,
    )
    .map(({ card }) => card);
}

// A gold tag stamped over the top left corner, sized from the card, which ranges from a small
// summary card to the full screen, with a floor so that it always reads. A card without it is a
// duplicate, whose coins the summary adds up.
function NewMark() {
  const t = useTranslations('Booster');

  return (
    <span className="pointer-events-none absolute inset-0 [container-type:inline-size]">
      <span className="ui-new-badge absolute -top-[max(0.4rem,3cqw)] -left-[max(0.4rem,3cqw)] rounded-[0.2em] border-[max(2px,0.6cqw)] border-ui-ink px-[0.35em] py-[0.05em] text-[max(1rem,9cqw)] leading-tight font-bold text-ui-ink uppercase">
        {t('new')}
      </span>
    </span>
  );
}

function isSpecial(card: RevealedCard) {
  return card.variant !== 'normal';
}

function SealedPack({
  setId,
  setName,
  logoUrl,
  size,
  onTorn,
  onCancel,
}: {
  setId: SetId;
  setName: string;
  logoUrl: string | null;
  size: BoosterLotSize;
  onTorn: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('Booster');
  const drag = useRef<{ startX: number; width: number } | null>(null);
  const tearTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [progress, setProgress] = useState(0);
  const [isTorn, setIsTorn] = useState(false);
  // Read at once, unlike the state: a finger sends several moves before the next render, and
  // each one past the line would otherwise cut the pack again, opening one booster each time.
  const hasTorn = useRef(false);

  const tear = () => {
    if (hasTorn.current) {
      return;
    }
    hasTorn.current = true;
    setIsTorn(true);
    setProgress(1);
    tearTimer.current = setTimeout(onTorn, TEAR_ANIMATION_MILLISECONDS);
  };

  // Leaving during the animation must not open the pack afterwards.
  useEffect(() => () => clearTimeout(tearTimer.current), []);

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
        style={packEdgeStyle(setId)}
        className="ui-pop-in relative aspect-[5/7.6] w-[min(calc(100vw-2rem),47vh,22.5rem)] cursor-grab touch-none select-none outline-offset-4 active:cursor-grabbing"
      >
        <PackBody setId={setId} setName={setName} logoUrl={logoUrl} cut={progress} />
        <LotTag size={size} />
        {/* The edge in two parts: what is still attached, and what lifts from the scissors. */}
        <PackEdge style={{ clipPath: `inset(-50% -50% -50% ${progress * 100}%)` }} />
        <PackEdge
          style={{
            clipPath: `inset(-50% ${(1 - progress) * 100}% -50% -50%)`,
            transformOrigin: isTorn ? '100% 100%' : `${progress * 100}% 100%`,
            transform: isTorn
              ? `translate(10%, -180%) rotate(${TORN_EDGE_DEGREES}deg)`
              : `rotate(${progress * LIFTED_EDGE_DEGREES}deg)`,
            opacity: isTorn ? 0 : 1,
          }}
          className={isTorn ? 'transition-[transform,opacity] duration-300' : ''}
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
          className="absolute top-[13%] -translate-x-1/2 -translate-y-1/2 ui-scrap px-1.5 text-lg text-ui-ink"
        >
          ✂
        </span>
      </button>
      <div className="text-center text-ui-paper">
        <p className="text-lg">{t('tearHint')}</p>
        <p className="pointer-coarse:hidden">{t('tearKeyHint')}</p>
      </div>
      {!isTorn && (
        <button
          type="button"
          onClick={onCancel}
          className="fixed top-4 right-4 cursor-pointer ui-paper-button bg-ui-paper px-4 py-1 font-semibold text-ui-ink"
        >
          {t('cancel')}
        </button>
      )}
    </div>
  );
}

// While the server draws the cards, in the same place as the pack before and after.
function CutPack({
  setId,
  setName,
  logoUrl,
  size,
}: {
  setId: SetId;
  setName: string;
  logoUrl: string | null;
  size: BoosterLotSize;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div
        style={packEdgeStyle(setId)}
        className="relative aspect-[5/7.6] w-[min(calc(100vw-2rem),47vh,22.5rem)]"
      >
        <PackBody setId={setId} setName={setName} logoUrl={logoUrl} cut={1} />
        <LotTag size={size} />
        <span aria-hidden="true" className="absolute inset-x-0 top-[13%] h-1 bg-ui-ink" />
      </div>
      <div className="h-14" />
    </div>
  );
}

function GodPackBanner() {
  const t = useTranslations('Booster');

  return (
    <p className="ui-god-pack-banner ui-paper-button bg-ui-accent px-5 py-0.5 text-2xl font-bold text-ui-ink">
      {t('godPack')}
    </p>
  );
}

function Reveal({
  cards,
  isGodPack,
  arrivalTier,
  canTease,
  onFinished,
}: {
  cards: RevealedCard[];
  isGodPack: boolean;
  // The tier of the pack, whose flash this screen fades out of.
  arrivalTier: PullTier;
  // Whether a great card may be announced before it shows, which the player can turn off.
  canTease: boolean;
  onFinished: () => void;
}) {
  const t = useTranslations('Booster');
  const [revealed, setRevealed] = useState(0);
  const current = revealed > 0 ? cards[revealed - 1] : null;
  const next = cards[revealed];
  const isLast = revealed === cards.length;
  const tier = current?.tier ?? 0;
  const { canvas, emit } = useSparks();
  const cardBox = useRef<HTMLDivElement>(null);
  // Before a great card, the current one trembles and the button calls for it.
  const isTeasing = canTease && (next?.tier ?? 0) >= FIRST_TEASED_TIER;

  // Loaded ahead of time, so that each card appears the moment it's revealed.
  useEffect(() => {
    for (const { imageUrl } of cards) {
      if (imageUrl) {
        new Image().src = `${imageUrl}/high.webp`;
      }
    }
  }, [cards]);

  useEffect(() => {
    const box = cardBox.current?.getBoundingClientRect();
    if (box && tier > 0) {
      emit({
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        count: tier * 70,
        colors: tierColors(tier),
        speed: 300 + tier * 130,
      });
    }
  }, [emit, tier]);

  return (
    <div
      style={
        {
          '--pull-color': tierColor(Math.max(tier, next?.tier ?? 0) as PullTier),
          '--pull-shake': `${tier * 2}px`,
        } as CSSProperties
      }
      className="relative flex h-full w-full flex-col items-center justify-center gap-3"
    >
      <SparksCanvas canvas={canvas} />
      {arrivalTier > 0 && revealed === 0 && (
        <div
          aria-hidden="true"
          className="ui-pull-arrive pointer-events-none fixed inset-0 z-40"
          style={{ background: arrivalTier >= 3 ? '#ffffff' : tierColor(arrivalTier) }}
        />
      )}
      {tier >= FIRST_FLASHING_TIER && (
        <div
          key={revealed}
          aria-hidden="true"
          className="ui-pull-arrive pointer-events-none fixed inset-0 z-40 bg-white"
        />
      )}
      {isGodPack && <GodPackBanner />}
      <p aria-live="polite" className="text-lg font-semibold text-ui-paper">
        {current ? current.name : t('readyToReveal')}
      </p>
      <div
        key={revealed}
        ref={cardBox}
        className={`relative aspect-[5/7] w-[min(100%,44vh,21.4rem)] [perspective:60rem] ${
          isGodPack ? '[@media(max-height:30rem)]:w-[34vh]' : ''
        } ${isTeasing ? 'ui-pull-shake' : tier >= FIRST_SHAKING_TIER ? 'ui-pull-shake-once' : ''}`}
        style={isTeasing ? ({ '--pull-shake': '1.5px' } as CSSProperties) : undefined}
      >
        {tier >= FIRST_RAYS_TIER && (
          <PullRays tier={tier} className="top-1/2 left-1/2 size-[170vmin] -translate-1/2" />
        )}
        <div className="ui-card-flip relative size-full">
          <TiltCard variant={current?.variant ?? 'normal'} isFullArt={current?.isFullArt}>
            {current ? (
              <>
                <CardPicture name={current.name} imageUrl={current.imageUrl} quality="high" />
                {current.isNew && <NewMark />}
              </>
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
        className={`cursor-pointer ui-paper-button bg-ui-accent px-6 py-1.5 text-lg font-semibold text-ui-ink ${
          isTeasing ? 'ui-pull-tease' : ''
        }`}
      >
        {isLast ? t('seeAll') : t('reveal')}
      </button>
      {/* The space stays taken on the last card, so that the screen doesn't jump. */}
      <div className="h-6">
        {!isLast && (
          <button
            type="button"
            onClick={onFinished}
            className="cursor-pointer text-ui-paper/70 underline hover:text-ui-paper focus-visible:text-ui-paper"
          >
            {t('skip')}
          </button>
        )}
      </div>
    </div>
  );
}

function EnlargedCard({ card, onClose }: { card: RevealedCard; onClose: () => void }) {
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
    <div className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ui-ink p-4">
      <div className={`ui-pop-in ${ENLARGED_CARD_CLASS}`}>
        <TiltCard variant={card.variant} isFullArt={card.isFullArt}>
          <CardPicture name={card.name} imageUrl={card.imageUrl} quality="max" />
          {card.isNew && <NewMark />}
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
        className="cursor-pointer ui-paper-button bg-ui-accent px-6 py-1.5 text-lg font-semibold text-ui-ink"
      >
        {t('back')}
      </button>
    </div>
  );
}

// Every card of the booster, or of the whole lot, the best first, to enlarge one by one.
function Summary({
  cards,
  isGodPack,
  size,
  onClose,
}: {
  cards: RevealedCard[];
  isGodPack: boolean;
  size: BoosterLotSize;
  onClose: () => void;
}) {
  const t = useTranslations('Booster');
  const [enlarged, setEnlarged] = useState<RevealedCard | null>(null);
  const coinsEarned = cards.reduce((total, { coins }) => total + coins, 0);
  const newCards = cards.filter(({ isNew }) => isNew).length;
  const isLot = size > 1;

  return (
    <div
      className={`relative flex h-full flex-col items-center gap-4 ${
        isLot ? 'justify-start py-2' : 'justify-center'
      }`}
    >
      {isGodPack && <GodPackBanner />}
      <h2 className="font-display text-2xl text-ui-paper">
        {isLot ? t('lotSummaryTitle', { count: size }) : t('summaryTitle')}
      </h2>
      {isLot && <p className="-mt-2 text-ui-paper/80">{t('lotNewCards', { count: newCards })}</p>}
      <ul
        inert={enlarged !== null}
        className={`grid w-full max-w-3xl grid-cols-5 gap-1.5 sm:gap-2 ${
          isLot ? 'min-h-0 flex-1 overflow-y-auto p-2' : ''
        }`}
      >
        {keyedCards(cards).map(({ card, key }) => (
          <li key={key} className="ui-pop-in aspect-[5/7]">
            <button
              type="button"
              aria-label={t(card.isNew ? 'enlargeNewCard' : 'enlargeCard', { name: card.name })}
              onClick={() => setEnlarged(card)}
              style={
                card.tier > 0
                  ? { boxShadow: `0 0 1.1rem 0.25rem ${tierColor(card.tier)}` }
                  : undefined
              }
              className={`relative block size-full cursor-pointer rounded-[4.5%/3.2%] outline-offset-2 ${
                isSpecial(card) ? 'ui-foil-idle shadow-[0_0_0.9rem_0.15rem_var(--ui-accent)]' : ''
              }`}
            >
              <CardPicture name={card.name} imageUrl={card.imageUrl} quality="low" />
              <CardFoil foil={cardFoil(card.variant, card.isFullArt)} />
              {card.isNew && <NewMark />}
            </button>
          </li>
        ))}
      </ul>
      {coinsEarned > 0 && (
        <p className="flex items-center gap-1.5 text-lg font-semibold text-ui-accent">
          <span
            aria-hidden="true"
            className="size-4 rounded-full border-2 border-ui-ink bg-ui-accent"
          />
          {t('summaryCoins', { count: coinsEarned })}
        </p>
      )}
      <button
        type="button"
        inert={enlarged !== null}
        onClick={onClose}
        className="cursor-pointer ui-paper-button bg-ui-accent px-6 py-1.5 text-lg font-semibold text-ui-ink"
      >
        {t('done')}
      </button>
      {enlarged && <EnlargedCard card={enlarged} onClose={() => setEnlarged(null)} />}
    </div>
  );
}

type Props = {
  opening: Opening;
  // Whether a cut pack climbs through light effects up to its best card, from the settings.
  pullEffects: boolean;
  onCut: () => void;
  onClose: () => void;
};

export function BoosterOpening({ opening, pullEffects, onCut, onClose }: Props) {
  const t = useTranslations('Booster');
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<'pull' | 'reveal' | 'summary'>('pull');
  const isLot = opening.size > 1;
  const finishPull = useCallback(() => setStep(isLot ? 'summary' : 'reveal'), [isLot]);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // Each screen replaces the button that had the focus, and the next one is ready to be pressed.
  // biome-ignore lint/correctness/useExhaustiveDependencies: these are what change the screen.
  useEffect(() => {
    dialog.current?.querySelector('button')?.focus();
  }, [opening.status, step]);

  // A lot climbs up to its best card, and skips the reveal card by card for its summary.
  const allCards = opening.status === 'ready' ? opening.packs.flatMap(({ cards }) => cards) : [];
  const isGodPack = opening.status === 'ready' && opening.packs.some((pack) => pack.isGodPack);
  const tier =
    opening.status === 'ready'
      ? packTier(
          allCards.map((card) => card.tier),
          isGodPack,
        )
      : 0;
  // Without the pull effects, nothing tells what the pack holds before its cards show: it opens
  // plainly, a god pack is only told in the summary, and no great card is announced ahead. Each
  // card still shines as it is revealed, since it is in sight by then.
  const announcedTier = pullEffects ? tier : 0;
  const isGodPackAnnounced = isGodPack && (pullEffects || step === 'summary');

  const canLeave = opening.status === 'sealed' || opening.status === 'error' || step === 'summary';

  return (
    <dialog
      ref={dialog}
      aria-label={t('title')}
      onCancel={(event) => {
        // A pack that has been cut can't be abandoned halfway.
        if (!canLeave) {
          event.preventDefault();
        }
      }}
      onClose={onClose}
      onKeyDown={(event) => {
        // While the cards are being revealed, Escape skips to the summary, like the skip button.
        // Elsewhere before the summary, it does nothing: stopping the cancel isn't enough, since
        // the browser closes a dialog on a second Escape without asking unless the key is stopped.
        if (event.key === 'Escape' && !canLeave) {
          event.preventDefault();
          if (opening.status === 'ready' && step === 'reveal') {
            setStep('summary');
          }
          return;
        }
        moveThroughChoices(event);
      }}
      // The light effects reach past the screen, which must not make it scroll.
      className={`m-0 size-full max-h-none max-w-none bg-ui-ink/95 p-4 font-game backdrop:bg-transparent ${
        opening.status === 'ready' && step !== 'summary' ? 'overflow-hidden' : ''
      }`}
    >
      {opening.status === 'sealed' && (
        <div className="flex h-full items-center justify-center">
          <SealedPack
            setId={opening.setId}
            setName={opening.setName}
            logoUrl={opening.logoUrl}
            size={opening.size}
            onTorn={onCut}
            onCancel={onClose}
          />
        </div>
      )}
      {opening.status === 'cutting' && (
        <div className="flex h-full items-center justify-center">
          <CutPack
            setId={opening.setId}
            setName={opening.setName}
            logoUrl={opening.logoUrl}
            size={opening.size}
          />
        </div>
      )}
      {opening.status === 'error' && (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-ui-paper">
          <p className="max-w-sm text-xl">{t('error')}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCut}
              className="cursor-pointer ui-paper-button bg-ui-accent px-5 py-1.5 font-semibold text-ui-ink"
            >
              {t('retry')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer ui-paper-button border-2 border-ui-paper px-5 py-1.5 font-semibold"
            >
              {t('back')}
            </button>
          </div>
        </div>
      )}
      {opening.status === 'ready' && (
        <div className="flex h-full items-center justify-center">
          {isGodPackAnnounced && step !== 'pull' && (
            <div
              aria-hidden="true"
              className="ui-god-pack-glow pointer-events-none fixed inset-0"
            />
          )}
          {step === 'pull' && (
            <PullScene
              setId={opening.setId}
              setName={opening.setName}
              logoUrl={opening.logoUrl}
              tier={announcedTier}
              isGodPack={isGodPack && pullEffects}
              onDone={finishPull}
            />
          )}
          {step === 'reveal' && (
            <Reveal
              cards={opening.packs[0].cards}
              isGodPack={isGodPackAnnounced}
              arrivalTier={announcedTier}
              canTease={pullEffects}
              onFinished={() => setStep('summary')}
            />
          )}
          {step === 'summary' && (
            <Summary
              cards={isLot ? lotCards(opening.packs) : opening.packs[0].cards}
              isGodPack={isGodPack}
              size={opening.size}
              onClose={onClose}
            />
          )}
        </div>
      )}
    </dialog>
  );
}
