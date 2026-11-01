'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type BinderCard,
  type BinderSlot,
  binderSlots,
  type Collection,
  clampPage,
  ownedSlotCount,
  pageCount,
  slotsOnPage,
} from '@/game/binder';
import type { PlayableSet, SetId } from '@/game/card-sets';
import { TiltCard } from './tilt-card';

const POCKET_CLASS = 'relative aspect-[5/7] rounded-[4.5%/3.2%]';
const NAV_BUTTON_CLASS =
  'cursor-pointer rounded-full border-4 border-ui-ink bg-ui-accent px-4 py-1 font-semibold text-ui-ink shadow-[0_4px_0_var(--ui-ink)] disabled:cursor-default disabled:opacity-40';

type Catalogue = { setName: string; cards: BinderCard[] };

function CardImage({
  card,
  quality,
  className,
}: {
  card: BinderCard;
  quality: 'high' | 'low';
  className: string;
}) {
  if (!card.imageUrl) {
    return (
      <span className={`flex items-center justify-center p-1 text-xs ${className}`}>
        {card.name}
      </span>
    );
  }
  return (
    // The images come from the card catalogue's own server, in its optimised sizes.
    // biome-ignore lint/performance/noImgElement: next/image would only proxy them again.
    <img
      src={`${card.imageUrl}/${quality}.webp`}
      alt={card.name}
      draggable={false}
      loading="lazy"
      className={className}
    />
  );
}

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
      className={`${POCKET_CLASS} cursor-pointer outline-offset-2`}
    >
      <CardImage
        card={slot.card}
        quality="low"
        className="size-full rounded-[4.5%/3.2%] bg-ui-paper object-cover"
      />
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

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ui-ink p-4">
      <div className="ui-pop-in aspect-[5/7] w-[min(100%,50vh,24rem)]">
        <TiltCard isSpecial={slot.variant !== 'normal'}>
          <CardImage
            card={slot.card}
            quality="high"
            className="size-full rounded-[4.5%/3.2%] object-cover"
          />
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
  const pages = pageCount(slots.length);

  const turn = (step: number) => setPage((current) => clampPage(current + step, slots.length));

  // On the window, because the focus can be anywhere in the dialog, such as on its close button.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (detail) {
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        setPage((current) =>
          clampPage(current + (event.key === 'ArrowLeft' ? -1 : 1), slots.length),
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detail, slots.length]);

  return (
    <div className="flex h-full flex-col items-center gap-3">
      <div className="text-center text-ui-paper">
        <h2 className="sr-only">{catalogue.setName}</h2>
        <p>{t('progress', { owned: ownedSlotCount(slots, collection), total: slots.length })}</p>
      </div>
      <ul
        key={page}
        className="ui-pop-in grid min-h-0 w-[min(100%,calc((100dvh-17.5rem)*0.7))] sm:w-[min(100%,calc((100dvh-12rem)*0.7))] grid-cols-3 gap-2 rounded-2xl border-4 border-ui-paper/40 bg-[#3b3157] p-2"
      >
        {slotsOnPage(slots, page).map((slot) => (
          <li key={slot.key}>
            <Pocket slot={slot} count={collection[slot.key] ?? 0} onOpen={() => setDetail(slot)} />
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3 text-ui-paper">
        <button
          type="button"
          disabled={page === 0}
          aria-label={t('previousPage')}
          onClick={() => turn(-1)}
          className={NAV_BUTTON_CLASS}
        >
          ◀
        </button>
        <span aria-live="polite">{t('page', { current: page + 1, total: pages })}</span>
        <button
          type="button"
          disabled={page === pages - 1}
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
  const [setId, setSetId] = useState<SetId | undefined>(sets[0]?.id);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt exists to run this again.
  useEffect(() => {
    let isCurrent = true;
    setHasFailed(false);
    setCatalogue(null);

    if (!setId) {
      setHasFailed(true);
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

  return (
    <dialog
      ref={dialog}
      aria-label={t('title')}
      onClose={onClose}
      className="m-0 size-full max-h-none max-w-none bg-ui-ink/95 p-4 font-game backdrop:bg-transparent"
    >
      <form method="dialog" className="absolute top-4 right-4 z-20">
        <button
          type="submit"
          className="cursor-pointer rounded-full border-4 border-ui-ink bg-ui-paper px-4 py-1 font-semibold text-ui-ink"
        >
          {t('close')}
        </button>
      </form>
      <div className="flex h-full flex-col gap-2 pt-12 sm:pt-0">
        <div className="flex flex-wrap justify-center gap-2">
          {sets.map(({ id, name }) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === setId}
              onClick={() => setSetId(id)}
              className={`cursor-pointer rounded-full border-4 border-ui-ink px-4 py-1 font-semibold ${
                id === setId ? 'bg-ui-accent text-ui-ink' : 'bg-ui-paper/80 text-ui-ink'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          {catalogue && <Pages key={setId} catalogue={catalogue} collection={collection} />}
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
      </div>
    </dialog>
  );
}
