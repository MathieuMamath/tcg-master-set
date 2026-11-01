'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type BinderCard,
  type BinderSlot,
  binderSlots,
  bindersToChoose,
  type Collection,
  ownedInSet,
  ownedSlotCount,
  pageCount,
  pagesShown,
  slotsOnPage,
  turnPage,
} from '@/game/binder';
import type { PlayableSet } from '@/game/card-sets';
import {
  BinderCover,
  BinderOpening,
  NARROW_OPENING_MILLISECONDS,
  WIDE_OPENING_MILLISECONDS,
  WIDE_PAGE_WIDTH_CLASS,
} from './binder-cover';
import { CardPicture } from './card-picture';
import { TiltCard } from './tilt-card';
import { useWideScreen } from './use-wide-screen';

const CLOSE_BUTTON_CLASS =
  'cursor-pointer rounded-full border-4 border-ui-ink bg-ui-paper px-4 py-1 font-semibold text-ui-ink';
const POCKET_CLASS = 'relative aspect-[5/7] rounded-[4.5%/3.2%]';
const NAV_BUTTON_CLASS =
  'cursor-pointer rounded-full border-4 border-ui-ink bg-ui-accent px-4 py-1 font-semibold text-ui-ink shadow-[0_4px_0_var(--ui-ink)] disabled:cursor-default disabled:opacity-40';

type Catalogue = { setName: string; cards: BinderCard[] };

function VariantTag({ variant }: { variant: string }) {
  const t = useTranslations('Binder.variants');
  if (
    variant !== 'reverse' &&
    variant !== 'holo' &&
    variant !== 'firstEdition' &&
    variant !== 'wPromo'
  ) {
    return null;
  }
  return (
    <span className="absolute inset-x-0 bottom-1 mx-auto w-fit rounded-full border-2 border-ui-ink bg-ui-accent px-1.5 text-[0.65rem] leading-4 font-semibold text-ui-ink">
      {t(variant)}
    </span>
  );
}

function Pocket({ slot, count, onOpen }: { slot: BinderSlot; count: number; onOpen: () => void }) {
  const t = useTranslations('Binder');

  if (count === 0) {
    return (
      <div
        className={`${POCKET_CLASS} flex flex-col items-center justify-center border-2 border-dashed border-ui-paper/30 bg-ui-paper/5 text-ui-paper/60`}
      >
        <span className="text-lg font-semibold">{slot.card.localId}</span>
        <span className="sr-only">{t('emptySlot')}</span>
        <VariantTag variant={slot.variant} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('viewCard', { name: slot.card.name, count })}
      className={`${POCKET_CLASS} block w-full cursor-pointer outline-offset-2`}
    >
      <CardPicture name={slot.card.name} imageUrl={slot.card.imageUrl} quality="low" />
      <VariantTag variant={slot.variant} />
      {count > 1 && (
        <span className="absolute -top-1 -right-1 rounded-full border-2 border-ui-ink bg-ui-paper px-1.5 text-xs font-semibold text-ui-ink">
          ×{count}
        </span>
      )}
    </button>
  );
}

function CardDetail({
  slot,
  count,
  onClose,
}: {
  slot: BinderSlot;
  count: number;
  onClose: () => void;
}) {
  const t = useTranslations('Binder');
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
  }, []);

  // Escape goes back to the page first, rather than closing the whole binder.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    // Before the binder's own handler, which leaves the keys that are already used.
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ui-ink p-4">
      <div className="ui-pop-in aspect-[5/7] w-[min(100%,50vh,24rem)]">
        <TiltCard isSpecial={slot.variant !== 'normal'}>
          <CardPicture name={slot.card.name} imageUrl={slot.card.imageUrl} quality="high" />
        </TiltCard>
      </div>
      <p className="text-center text-lg font-semibold text-ui-paper">
        {slot.card.name}
        {slot.card.rarity && ` · ${slot.card.rarity}`}
      </p>
      <p className="text-ui-paper/80">{t('copies', { count })}</p>
      <button ref={close} type="button" onClick={onClose} className={NAV_BUTTON_CLASS}>
        {t('backToPage')}
      </button>
    </div>
  );
}

function Pages({ catalogue, collection }: { catalogue: Catalogue; collection: Collection }) {
  const t = useTranslations('Binder');
  const slots = useMemo(() => binderSlots(catalogue.cards), [catalogue]);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<BinderSlot | null>(null);
  // The first pages take over from the opening animation, so they must appear without moving.
  const [hasTurned, setHasTurned] = useState(false);
  const isWide = useWideScreen();
  const pagesAtOnce = isWide ? 2 : 1;
  const pages = pageCount(slots.length);
  const shown = pagesShown(page, slots.length, pagesAtOnce);
  const lastShown = shown[shown.length - 1];

  const turn = (direction: -1 | 1) => {
    setHasTurned(true);
    setPage((current) => turnPage(current, direction, slots.length, pagesAtOnce));
  };

  // On the window, because the focus can be anywhere in the dialog, such as on its close button.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (detail) {
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        setHasTurned(true);
        setPage((current) =>
          turnPage(current, event.key === 'ArrowLeft' ? -1 : 1, slots.length, pagesAtOnce),
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detail, slots.length, pagesAtOnce]);

  const pageClass = isWide
    ? WIDE_PAGE_WIDTH_CLASS
    : 'w-[min(100%,calc((100dvh-14.5rem)*0.7))] sm:w-[min(100%,calc((100dvh-11.5rem)*0.7))]';

  return (
    <div className="flex h-full flex-col items-center gap-3">
      <div className="text-center text-ui-paper">
        <h2 className="text-xl font-semibold">{catalogue.setName}</h2>
        <p>{t('progress', { owned: ownedSlotCount(slots, collection), total: slots.length })}</p>
      </div>
      <div className="flex min-h-0 w-full justify-center gap-2">
        {shown.map((shownPage) => (
          <ul
            key={shownPage}
            className={`${hasTurned ? 'ui-pop-in' : ''} grid min-h-0 ${pageClass} grid-cols-3 gap-2 rounded-2xl border-4 border-ui-paper/40 bg-[#3b3157] p-2`}
          >
            {slotsOnPage(slots, shownPage).map((slot) => (
              <li key={slot.key}>
                <Pocket
                  slot={slot}
                  count={collection[slot.key] ?? 0}
                  onOpen={() => setDetail(slot)}
                />
              </li>
            ))}
          </ul>
        ))}
        {isWide && shown.length === 1 && (
          <div
            aria-hidden="true"
            className={`${pageClass} rounded-2xl border-4 border-ui-paper/40 bg-[#3b3157]`}
          />
        )}
      </div>
      <div className="flex items-center gap-3 text-ui-paper">
        <button
          type="button"
          disabled={shown[0] === 0}
          aria-label={t('previousPage')}
          onClick={() => turn(-1)}
          className={NAV_BUTTON_CLASS}
        >
          ◀
        </button>
        <span aria-live="polite">
          {shown.length === 2
            ? t('pages', { first: shown[0] + 1, last: lastShown + 1, total: pages })
            : t('page', { current: shown[0] + 1, total: pages })}
        </span>
        <button
          type="button"
          disabled={lastShown === pages - 1}
          aria-label={t('nextPage')}
          onClick={() => turn(1)}
          className={NAV_BUTTON_CLASS}
        >
          ▶
        </button>
      </div>
      {detail && (
        <CardDetail
          slot={detail}
          count={collection[detail.key] ?? 0}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

type Props = {
  sets: readonly PlayableSet[];
  collection: Collection;
  onClose: () => void;
};

export function BinderView({ sets, collection, onClose }: Props) {
  const t = useTranslations('Binder');
  const locale = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [chosenSet, setChosenSet] = useState<PlayableSet | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const setId = chosenSet?.id;
  const isBinderChosen = chosenSet !== null;
  const isWide = useWideScreen();
  const binders = bindersToChoose(sets, collection);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt exists to run this again.
  useEffect(() => {
    let isCurrent = true;
    setHasFailed(false);
    setCatalogue(null);

    if (!setId) {
      return;
    }

    fetch(`/api/binder?locale=${locale}&set=${setId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((loaded: Catalogue) => {
        if (isCurrent) {
          setCatalogue(loaded);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setHasFailed(true);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [locale, setId, attempt]);

  useEffect(() => {
    if (!isOpening) {
      return;
    }
    const isStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = isWide ? WIDE_OPENING_MILLISECONDS : NARROW_OPENING_MILLISECONDS;
    const timer = setTimeout(() => setIsOpening(false), isStill ? 0 : duration);
    return () => clearTimeout(timer);
  }, [isOpening, isWide]);

  // Escape goes back to the choice of binders first, rather than leaving altogether.
  useEffect(() => {
    if (!isBinderChosen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        setChosenSet(null);
        setIsOpening(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isBinderChosen]);

  const choose = (set: PlayableSet) => {
    setChosenSet(set);
    setIsOpening(true);
  };

  const closeBinder = () => {
    setChosenSet(null);
    setIsOpening(false);
  };

  return (
    <dialog
      ref={dialog}
      aria-label={t('title')}
      onClose={onClose}
      className="m-0 size-full max-h-none max-w-none bg-ui-ink/95 p-4 font-game backdrop:bg-transparent"
    >
      {chosenSet ? (
        <button
          type="button"
          onClick={closeBinder}
          className={`${CLOSE_BUTTON_CLASS} absolute top-4 right-4 z-20`}
        >
          {t('closeBinder')}
        </button>
      ) : (
        <form method="dialog" className="absolute top-4 right-4 z-20">
          <button type="submit" className={CLOSE_BUTTON_CLASS}>
            {t('close')}
          </button>
        </form>
      )}
      {!chosenSet && (
        <div className="flex h-full flex-col items-center gap-5 overflow-y-auto pt-10 sm:pt-0">
          <div className="my-auto flex w-full flex-col items-center gap-5 py-2">
            <h2 className="text-center text-2xl font-semibold text-ui-paper">
              {sets.length > 0 ? t('chooseBinder') : t('error')}
            </h2>
            {sets.length > 0 && binders.every(({ owned }) => owned === 0) && (
              <p className="text-center text-ui-paper/80">{t('noCardsYet')}</p>
            )}
            <div className="flex w-full flex-wrap justify-center gap-5">
              {binders.map(({ owned, ...set }) => (
                <button
                  key={set.id}
                  type="button"
                  disabled={owned === 0}
                  aria-label={`${set.name}. ${t('progress', { owned, total: set.slotTotal })}`}
                  onClick={() => choose(set)}
                  className="ui-pop-in relative aspect-[5/6] w-[min(42%,46vh,11rem)] rounded-xl outline-offset-4 transition-transform enabled:cursor-pointer enabled:hover:-translate-y-1 enabled:focus-visible:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-45 disabled:grayscale"
                >
                  <BinderCover set={set} owned={owned} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {chosenSet && isOpening && (
        <BinderOpening
          set={chosenSet}
          owned={ownedInSet(collection, chosenSet.id)}
          isWide={isWide}
        />
      )}
      {chosenSet && !isOpening && (
        <div className="h-full pt-12 sm:pt-0">
          {catalogue && <Pages catalogue={catalogue} collection={collection} />}
          {!catalogue && !hasFailed && (
            <div className="flex h-full items-center justify-center text-xl text-ui-paper">
              {t('loading')}
            </div>
          )}
          {!catalogue && hasFailed && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-ui-paper">
              <p className="max-w-sm text-xl">{t('error')}</p>
              <button
                type="button"
                onClick={() => setAttempt(attempt + 1)}
                className={NAV_BUTTON_CLASS}
              >
                {t('retry')}
              </button>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
