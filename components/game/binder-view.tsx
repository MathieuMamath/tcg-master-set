'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  type AnimationEvent,
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { pageStep } from '@/game/menu-keys';
import {
  BinderCover,
  BinderOpening,
  BinderTitle,
  EMPTY_POCKET_CLASS,
  NARROW_OPENING_MILLISECONDS,
  PAGE_CLASS,
  WIDE_OPENING_MILLISECONDS,
  WIDE_PAGE_WIDTH_CLASS,
} from './binder-cover';
import { CardPicture, ENLARGED_CARD_CLASS } from './card-picture';
import { isFocusLost, moveThroughChoices, moveThroughChoicesOnScreen } from './menu-focus';
import { reportPlay } from './report';
import { TornPaper } from './shop-dialog';
import { TiltCard } from './tilt-card';
import { useWideScreen } from './use-wide-screen';

const CLOSE_BUTTON_CLASS =
  'cursor-pointer ui-paper-button bg-ui-paper px-4 py-1 font-semibold text-ui-ink';
const POCKET_CLASS = 'relative aspect-[5/7] rounded-[4.5%/3.2%]';
const NAV_BUTTON_CLASS =
  'cursor-pointer ui-paper-button bg-ui-accent px-4 py-1 font-semibold text-ui-ink aria-disabled:cursor-default aria-disabled:opacity-40';

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
    <span className="absolute inset-x-0 bottom-1 mx-auto w-fit -rotate-3 bg-(--ui-tape) px-1.5 text-[0.65rem] leading-4 font-semibold text-ui-ink">
      {t(variant)}
    </span>
  );
}

function Pocket({ slot, count, onOpen }: { slot: BinderSlot; count: number; onOpen: () => void }) {
  const t = useTranslations('Binder');

  if (count === 0) {
    return (
      <div
        className={`${POCKET_CLASS} ${EMPTY_POCKET_CLASS} flex flex-col items-center justify-center text-ui-ink/35`}
      >
        <span className="font-digits text-lg font-bold">{slot.card.localId}</span>
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
      {/* The light on the pocket's plastic sleeve. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(115deg,transparent_38%,rgb(255_255_255/24%)_46%,transparent_54%)]"
      />
      <VariantTag variant={slot.variant} />
      {count > 1 && (
        <span className="absolute -top-1.5 -right-1.5 grid min-w-6 rotate-6 place-items-center rounded-full border-2 border-ui-paper bg-ui-stamp px-1 font-digits text-xs leading-5 font-bold text-ui-paper shadow-[1px_2px_0_var(--ui-shadow)]">
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

  // Read while rendering, because the pocket behind loses the focus once this appears.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  // The focus goes back to the pocket this card came from.
  useEffect(() => {
    close.current?.focus();
    return () => opener?.focus();
  }, [opener]);

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
    <div className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-ui-ink/85 p-4">
      <div className={`ui-pop-in ${ENLARGED_CARD_CLASS}`}>
        <TiltCard isSpecial={slot.variant !== 'normal'}>
          <CardPicture name={slot.card.name} imageUrl={slot.card.imageUrl} quality="max" />
        </TiltCard>
      </div>
      <TornPaper className="flex flex-col items-center gap-1 px-6 pt-3 pb-4 text-center text-ui-ink">
        <p className="font-display text-lg">
          {slot.card.name}
          {slot.card.rarity && ` · ${slot.card.rarity}`}
        </p>
        <p className="text-ui-ink/75">{t('copies', { count })}</p>
        <button ref={close} type="button" onClick={onClose} className={`${NAV_BUTTON_CLASS} mt-1`}>
          {t('backToPage')}
        </button>
      </TornPaper>
    </div>
  );
}

// A page of pockets, or a blank sheet where the binder has no page left.
function PageSheet({
  page,
  slots,
  collection,
  className,
  onOpen,
}: {
  page: number | null;
  slots: readonly BinderSlot[];
  collection: Collection;
  className: string;
  onOpen: (slot: BinderSlot) => void;
}) {
  if (page === null) {
    return <div aria-hidden="true" className={`${className} ${PAGE_CLASS}`} />;
  }
  return (
    <ul className={`${className} ${PAGE_CLASS} content-start`}>
      {slotsOnPage(slots, page).map((slot) => (
        <li key={slot.key}>
          <Pocket slot={slot} count={collection[slot.key] ?? 0} onOpen={() => onOpen(slot)} />
        </li>
      ))}
    </ul>
  );
}

// A page on its way over: the side it starts from, and the side it shows once turned.
type Turn = { direction: -1 | 1; before: (number | null)[]; id: number };

// The page shown in each place, left then right on a wide screen, or the single one on a narrow
// screen. A missing page at the end of the binder leaves a blank sheet.
function spreadOf(shown: readonly number[], pagesAtOnce: number): (number | null)[] {
  return Array.from({ length: pagesAtOnce }, (_, index) => shown[index] ?? null);
}

function Pages({ catalogue, collection }: { catalogue: Catalogue; collection: Collection }) {
  const t = useTranslations('Binder');
  const slots = useMemo(() => binderSlots(catalogue.cards), [catalogue]);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<BinderSlot | null>(null);
  const [turning, setTurning] = useState<Turn | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const isWide = useWideScreen();
  const pagesAtOnce = isWide ? 2 : 1;
  const pages = pageCount(slots.length);
  const shown = pagesShown(page, slots.length, pagesAtOnce);
  const lastShown = shown[shown.length - 1];
  const spread = spreadOf(shown, pagesAtOnce);

  // Turns from the pages on show, which the animation keeps until the page has gone over.
  const turn = useCallback(
    (direction: -1 | 1) => {
      const next = turnPage(page, direction, slots.length, pagesAtOnce);
      if (next === page) {
        return;
      }
      const isStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTurning(
        isStill
          ? null
          : {
              direction,
              before: spreadOf(pagesShown(page, slots.length, pagesAtOnce), pagesAtOnce),
              id: Date.now(),
            },
      );
      setPage(next);
    },
    [page, slots.length, pagesAtOnce],
  );

  // On the window, because the focus can be anywhere in the dialog, such as on its close button.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (detail) {
        return;
      }
      // The arrows move from pocket to pocket, so the page keys turn the pages.
      const step = pageStep(event.code);
      if (step) {
        event.preventDefault();
        turn(step);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detail, turn]);

  // On arrival, and when a turned page takes away the pocket that had the focus.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new page is what can lose the focus.
  useEffect(() => {
    if (isFocusLost()) {
      root.current?.querySelector<HTMLElement>('button:not([aria-disabled="true"])')?.focus();
    }
  }, [shown[0], turning]);

  const pageClass = isWide
    ? WIDE_PAGE_WIDTH_CLASS
    : 'w-[min(100%,calc((100dvh-16rem)*0.7))] sm:w-[min(100%,calc((100dvh-13rem)*0.7))]';
  const sheetClass = 'w-full aspect-[5/7]';

  // While a page turns, each place shows what lies under the turning page: going forwards on a
  // wide screen, the old left page stays until the turning page covers it, and the new right page
  // is already there underneath. Going backwards, the other way round.
  const isForward = turning?.direction === 1;
  const under = spread.map((shownPage, index) => {
    if (!turning || !isWide) {
      return turning && !isForward ? turning.before[index] : shownPage;
    }
    const keepsOld = isForward ? index === 0 : index === 1;
    return keepsOld ? turning.before[index] : shownPage;
  });

  const sheet = (shownPage: number | null, className = sheetClass) => (
    <PageSheet
      page={shownPage}
      slots={slots}
      collection={collection}
      className={className}
      onOpen={setDetail}
    />
  );

  // Only the turning page's own animation, not one inside it.
  const endTurn = (event: AnimationEvent) => {
    if (event.target === event.currentTarget) {
      setTurning(null);
    }
  };

  // The turning page: the side it leaves from, carrying its old face, and on a wide screen the
  // new page on its back. On a narrow screen it lifts away to the left, or comes back from there.
  const turningPage = (() => {
    if (!turning) {
      return null;
    }
    if (!isWide) {
      return (
        <div
          key={turning.id}
          className={`ui-page-lift absolute inset-0 origin-left [backface-visibility:hidden] ${
            isForward ? '' : '[animation-direction:reverse]'
          }`}
          onAnimationEnd={endTurn}
        >
          {sheet(isForward ? turning.before[0] : spread[0], 'size-full')}
        </div>
      );
    }
    const front = isForward ? turning.before[1] : turning.before[0];
    const back = isForward ? spread[0] : spread[1];
    return (
      <div
        key={turning.id}
        style={
          {
            '--turn-to': isForward ? '-180deg' : '180deg',
            transformOrigin: isForward ? '-0.25rem 50%' : 'calc(100% + 0.25rem) 50%',
          } as CSSProperties
        }
        className={`ui-page-turn absolute top-0 ${isForward ? 'left-0' : 'right-0'} size-full [transform-style:preserve-3d]`}
        onAnimationEnd={endTurn}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]">
          {sheet(front, 'size-full')}
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {sheet(back, 'size-full')}
        </div>
      </div>
    );
  })();
  // Which place the turning page starts from.
  const turnsFrom = turning ? (isWide && !isForward ? 0 : isWide ? 1 : 0) : -1;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: only catches keys from the buttons inside.
    <div
      ref={root}
      onKeyDown={moveThroughChoicesOnScreen}
      className="flex h-full flex-col items-center gap-4"
    >
      <BinderTitle
        name={catalogue.setName}
        progress={t('progress', { owned: ownedSlotCount(slots, collection), total: slots.length })}
      />
      <div inert={detail !== null} className="relative flex min-h-0 w-full justify-center gap-2">
        {under.map((shownPage, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: the places are left and right.
            key={index}
            className={`relative min-h-0 ${pageClass} ${index === turnsFrom ? 'z-10' : ''}`}
          >
            {sheet(shownPage)}
            {index === turnsFrom && (
              // Only a picture of the pages, which the keyboard and screen readers skip.
              <div
                inert
                aria-hidden="true"
                // Seen from in front of the spine, which the page turns round.
                style={{ perspectiveOrigin: isWide && !isForward ? 'right center' : 'left center' }}
                className="absolute inset-0 [perspective:120rem]"
              >
                {turningPage}
              </div>
            )}
          </div>
        ))}
        {/* The rings holding the two pages together, across the spine. */}
        {isWide && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-[8%] left-1/2 flex -translate-x-1/2 flex-col justify-between"
          >
            {['top', 'middle', 'bottom'].map((ring) => (
              <span
                key={ring}
                className="h-3 w-9 rounded-full border-[3px] border-[#b9b7c2] shadow-[1px_2px_0_var(--ui-shadow)]"
              />
            ))}
          </div>
        )}
      </div>
      <div inert={detail !== null} className="flex items-center gap-3 text-ui-ink">
        {/* Not `disabled`, which would take the focus away at the first and last pages. */}
        <button
          type="button"
          aria-disabled={shown[0] === 0}
          aria-label={t('previousPage')}
          onClick={() => turn(-1)}
          className={NAV_BUTTON_CLASS}
        >
          ◀
        </button>
        <span
          aria-live="polite"
          className="ui-scrap px-3 pt-1 pb-0.5 font-digits text-sm font-bold"
        >
          {shown.length === 2
            ? t('pages', { first: shown[0] + 1, last: lastShown + 1, total: pages })
            : t('page', { current: shown[0] + 1, total: pages })}
        </span>
        <button
          type="button"
          aria-disabled={lastShown === pages - 1}
          aria-label={t('nextPage')}
          onClick={() => turn(1)}
          className={NAV_BUTTON_CLASS}
        >
          ▶
        </button>
      </div>
      <p className="text-sm text-ui-ink/70 pointer-coarse:hidden">{t('pageKeys')}</p>
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
  const binderList = useRef<HTMLDivElement>(null);
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

  // Ready to pick a binder, on arrival and when coming back from one.
  useEffect(() => {
    if (!isBinderChosen) {
      binderList.current?.querySelector<HTMLElement>('button:not([aria-disabled="true"])')?.focus();
    }
  }, [isBinderChosen]);

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
    reportPlay({ type: 'binder.viewed', setId: set.id });
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
      onKeyDown={chosenSet ? undefined : moveThroughChoices}
      // A desk of kraft paper, a little darker towards its edges.
      className="m-0 size-full max-h-none max-w-none bg-transparent bg-[radial-gradient(circle_at_50%_40%,rgb(210_177_131/70%),rgb(165_129_79/82%))] p-4 font-game text-ui-ink backdrop:bg-transparent"
    >
      <span aria-hidden="true" className="ui-paper-grain absolute inset-0" />
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
        <div className="relative flex h-full flex-col items-center gap-5 overflow-y-auto pt-10 sm:pt-0">
          <div className="my-auto flex w-full flex-col items-center gap-5 py-2">
            <h2 className="max-w-xl -rotate-1 ui-tape ui-scrap px-5 pt-2.5 pb-1.5 text-center font-display text-2xl">
              {sets.length > 0 ? t('chooseBinder') : t('noBinderYet')}
            </h2>
            {sets.length > 0 && binders.every(({ owned }) => owned === 0) && (
              <p className="text-center text-ui-ink/80">{t('noCardsYet')}</p>
            )}
            <div ref={binderList} className="flex w-full flex-wrap justify-center gap-6 pt-2">
              {binders.map(({ owned, ...set }) => (
                <button
                  key={set.id}
                  type="button"
                  // Not `disabled`, which would take the focus away from the keyboard.
                  aria-disabled={owned === 0}
                  aria-label={`${set.name}. ${t('progress', { owned, total: set.slotTotal })}`}
                  onClick={() => owned > 0 && choose(set)}
                  className="ui-pop-in relative aspect-[5/6] w-[min(42%,46vh,11rem)] rounded-md outline-none transition-transform odd:-rotate-2 even:rotate-[1.5deg] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-dashed focus-visible:outline-ui-stamp not-aria-disabled:cursor-pointer not-aria-disabled:hover:-translate-y-1 not-aria-disabled:focus-visible:-translate-y-1 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:grayscale"
                >
                  <BinderCover set={set} owned={owned} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {chosenSet && isOpening && (
        <div className="relative h-full">
          <BinderOpening
            set={chosenSet}
            owned={ownedInSet(collection, chosenSet.id)}
            isWide={isWide}
          />
        </div>
      )}
      {chosenSet && !isOpening && (
        <div className="relative h-full pt-12 sm:pt-0">
          {catalogue && <Pages catalogue={catalogue} collection={collection} />}
          {!catalogue && !hasFailed && (
            <div className="flex h-full items-center justify-center text-xl">{t('loading')}</div>
          )}
          {!catalogue && hasFailed && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
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
