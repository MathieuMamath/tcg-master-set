'use client';

import { useLocale, useTranslations } from 'next-intl';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { PlayableSet, SetId } from '@/game/card-sets';
import { gridStep } from '@/game/menu-keys';
import { affordableBoosters, type ShopkeeperLine } from '@/game/shop-dialogue';
import { BinderCover } from './binder-cover';
import { CoinIcon } from './hud-icons';
import { PackBody, PackEdge, packEdgeStyle } from './pack-art';
import { SellerPortrait } from './seller-portrait';
import { TornPaper } from './shop-dialog';

export type ShopKind = 'binder' | 'booster';

export type ShopItem = {
  set: PlayableSet;
  // Why it can't be bought, if it can't.
  refusal: 'alreadyOwned' | 'needsBinder' | null;
  // For a booster: how many the player has in the bag.
  inBag: number;
};

type Props = {
  kind: ShopKind;
  seller: { stock: 'latest' | 'thisYear' | 'older' | 'binderSeller'; name: string; title: string };
  items: readonly ShopItem[];
  coins: number;
  price: number;
  onBuy: (setId: SetId, quantity: number) => Promise<ShopkeeperLine>;
  onBack: () => void;
};

const CARDS_PER_BOOSTER = 10;
const QUANTITY_BUTTON_CLASS =
  'size-8 cursor-pointer ui-paper-button bg-[#e6ece8] text-xl leading-none outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-ui-stamp aria-disabled:cursor-not-allowed aria-disabled:opacity-40';

// The first item that can be bought, or the first of all.
function firstOnSale(items: readonly ShopItem[]): SetId | undefined {
  return (items.find(({ refusal }) => refusal === null) ?? items[0])?.set.id;
}

function BinderArt({ set }: { set: PlayableSet }) {
  return (
    <span className="relative block aspect-[4/5] w-full">
      <BinderCover set={set} />
    </span>
  );
}

function BoosterArt({ set }: { set: PlayableSet }) {
  return (
    <span style={packEdgeStyle(set.id)} className="relative block aspect-[5/7.6] w-full">
      <PackBody setId={set.id} setName={set.name} logoUrl={set.logoUrl} />
      <PackEdge />
    </span>
  );
}

function ItemArt({ kind, set }: { kind: ShopKind; set: PlayableSet }) {
  return kind === 'binder' ? <BinderArt set={set} /> : <BoosterArt set={set} />;
}

// What a seller has for sale: every item in a grid on the left, and the one chosen on the right,
// with its details and the button to buy it. On a phone, the two take turns on the screen.
export function ShopWindow({ kind, seller, items, coins, price, onBuy, onBack }: Props) {
  const t = useTranslations('Shopkeeper');
  const locale = useLocale();
  const [selectedId, setSelectedId] = useState(() => firstOnSale(items));
  const [answer, setAnswer] = useState<{ setId: SetId; line: ShopkeeperLine } | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  // How many boosters to buy at once. A binder is only ever bought alone.
  const [quantity, setQuantity] = useState(1);
  // On a phone, whether the details are shown instead of the grid.
  const [isShowingDetails, setIsShowingDetails] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const buyButton = useRef<HTMLButtonElement>(null);

  // The window opens with the keyboard on the item chosen for it.
  useEffect(() => {
    grid.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
  }, []);

  const selected = items.find(({ set }) => set.id === selectedId) ?? items[0];
  if (!selected) {
    return null;
  }
  const mostAtOnce = affordableBoosters(coins);
  const total = price * quantity;
  const refusal = selected.refusal ?? (coins < total ? 'notEnoughCoins' : null);
  const released = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${selected.set.releaseDate}T00:00:00Z`));
  const facts: [string, string | number][] =
    kind === 'binder'
      ? [
          [t('window.released'), released],
          [t('window.cardsToCollect'), selected.set.slotTotal],
        ]
      : [
          [t('window.released'), released],
          [t('window.cardsPerBooster'), CARDS_PER_BOOSTER],
          [t('window.inBag'), t('window.boosterCount', { count: selected.inBag })],
        ];

  const choose = (setId: SetId) => {
    setSelectedId(setId);
    setAnswer(null);
    setQuantity(1);
  };

  const tiles = () => Array.from(grid.current?.querySelectorAll<HTMLElement>('[data-item]') ?? []);

  // The arrows walk through the grid, and the choice follows the focus.
  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const all = tiles();
    const current = all.indexOf(document.activeElement as HTMLElement);
    const columns = all.filter((tile) => tile.offsetTop === all[0]?.offsetTop).length || 1;
    const next = gridStep(current, event.code, columns, all.length);
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    all[next]?.focus();
    const setId = items[next]?.set.id;
    if (setId) {
      choose(setId);
    }
  };

  const buy = async () => {
    if (isBuying || refusal) {
      return;
    }
    setIsBuying(true);
    const line = await onBuy(selected.set.id, quantity);
    setIsBuying(false);
    setAnswer({ setId: selected.set.id, line });
    if (line === 'thanks') {
      setQuantity(1);
    }
  };

  return (
    <TornPaper className="flex max-h-[calc(100dvh-2rem)] flex-col px-4 pt-4 pb-5 sm:px-6 sm:pt-5">
      <div className="flex items-center gap-3 border-b-2 border-dashed border-ui-ink/20 pb-3">
        {isShowingDetails ? (
          <button
            type="button"
            onClick={() => setIsShowingDetails(false)}
            className="cursor-pointer ui-paper-button bg-[#e6ece8] px-3 py-0.5 md:hidden"
          >
            ← {t('window.back')}
          </button>
        ) : null}
        <span
          aria-hidden="true"
          className={`size-12 shrink-0 overflow-hidden rounded-full border-3 border-ui-paper bg-[#e7d9bc] ring-2 ring-[#8e6b3e] sm:size-14 ${
            isShowingDetails ? 'max-md:hidden' : ''
          }`}
        >
          <SellerPortrait stock={seller.stock} />
        </span>
        <div className={`min-w-0 flex-1 ${isShowingDetails ? 'max-md:hidden' : ''}`}>
          <h2 id="shop-window-title" className="font-display text-lg leading-tight">
            {seller.name}{' '}
            <small className="font-game text-base text-ui-ink/65 max-sm:block">
              {seller.title}
            </small>
          </h2>
          <p className="max-sm:hidden">
            {t(kind === 'binder' ? 'window.binders' : 'window.boosters', { price })}
          </p>
        </div>
        <p className="ml-auto flex shrink-0 rotate-1 items-center gap-1.5 ui-scrap px-3 py-1 font-digits text-sm font-bold sm:text-base">
          <CoinIcon />
          {t('window.coins', { count: coins })}
        </p>
        <button
          type="button"
          aria-label={t('window.close')}
          onClick={onBack}
          className="size-9 shrink-0 rotate-2 cursor-pointer ui-paper-button bg-[#e6ece8] text-xl"
        >
          ×
        </button>
      </div>
      <div className="mt-3 grid min-h-0 flex-1 gap-5 md:grid-cols-[minmax(0,1.5fr)_minmax(17rem,1fr)]">
        <div
          ref={grid}
          role="listbox"
          aria-label={t(kind === 'binder' ? 'window.bindersList' : 'window.boostersList')}
          onKeyDown={onGridKeyDown}
          className={`grid max-h-[min(32rem,calc(100dvh-11rem))] grid-cols-[repeat(auto-fill,minmax(7.25rem,1fr))] content-start gap-3.5 overflow-y-auto p-2 max-md:grid-cols-2 ${
            isShowingDetails ? 'max-md:hidden' : ''
          }`}
        >
          {items.map(({ set, refusal: itemRefusal }) => {
            const isSelected = set.id === selected.set.id;
            return (
              <button
                key={set.id}
                type="button"
                role="option"
                data-item
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => {
                  choose(set.id);
                  setIsShowingDetails(true);
                }}
                onKeyDown={(event) => {
                  if (event.code === 'Enter' || event.code === 'Space') {
                    event.preventDefault();
                    choose(set.id);
                    setIsShowingDetails(true);
                    requestAnimationFrame(() => buyButton.current?.focus());
                  }
                }}
                className={`relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xs bg-[#efe6d2] px-2 pt-2.5 pb-2 text-center shadow-[2px_3px_0_var(--ui-shadow)] transition-transform odd:-rotate-[0.6deg] even:rotate-[0.6deg] hover:-translate-y-0.5 ${
                  isSelected
                    ? 'bg-[#fff8e2] outline-3 outline-offset-3 outline-dashed outline-ui-stamp'
                    : 'outline-none'
                }`}
              >
                <span className={`w-14 ${itemRefusal ? 'opacity-45 grayscale-[0.6]' : ''}`}>
                  <ItemArt kind={kind} set={set} />
                </span>
                <span className="flex min-h-[2.1em] items-center leading-tight">{set.name}</span>
                <span className="flex items-center gap-1 font-digits text-sm font-bold">
                  <CoinIcon />
                  {price}
                </span>
                {itemRefusal && (
                  <span
                    className={`absolute top-[30%] left-1/2 -translate-x-1/2 -rotate-12 border-3 bg-ui-paper/85 px-1.5 font-display text-xs whitespace-nowrap ${
                      itemRefusal === 'alreadyOwned'
                        ? 'border-ui-stamp text-ui-stamp'
                        : 'border-ui-ink/55 text-ui-ink/65'
                    }`}
                  >
                    {t(itemRefusal === 'alreadyOwned' ? 'window.owned' : 'window.needsBinder')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <section
          aria-labelledby="shop-item-title"
          onKeyDown={(event) => {
            // Escape leaves the details for the grid, rather than the window.
            if (event.code === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              setIsShowingDetails(false);
              tiles()
                .find((tile) => tile.getAttribute('aria-selected') === 'true')
                ?.focus();
            }
          }}
          className={`flex min-h-0 rotate-[0.3deg] flex-col gap-2.5 overflow-y-auto rounded-xs bg-[#efe6d2] p-4 ${
            isShowingDetails ? '' : 'max-md:hidden'
          }`}
        >
          {/* Drawn afresh for each item, or the logo of the one before would stay. */}
          <div key={selected.set.id} className="mx-auto w-28 py-1 md:w-32">
            <ItemArt kind={kind} set={selected.set} />
          </div>
          <h3 id="shop-item-title" className="text-center font-display text-xl leading-tight">
            {t(kind === 'binder' ? 'window.binderTitle' : 'window.boosterTitle', {
              set: selected.set.name,
            })}
          </h3>
          <dl className="grid gap-1">
            {facts.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-3 border-b border-dashed border-ui-ink/20 py-0.5"
              >
                <dt className="text-ui-ink/65">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
          {answer?.setId === selected.set.id && (
            <p
              role="status"
              className={`-rotate-1 px-2.5 py-1 text-center shadow-[2px_3px_0_var(--ui-shadow)] ${
                answer.line === 'thanks' ? 'bg-ui-accent' : 'bg-ui-paper text-ui-danger'
              }`}
            >
              {answer.line === 'thanks'
                ? t(`thanks.${seller.stock}`)
                : t(answer.line === 'greeting' ? 'unavailable' : answer.line)}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
            {kind === 'booster' && (
              <fieldset className="flex items-center gap-2">
                <legend className="sr-only">{t('window.quantity')}</legend>
                <button
                  type="button"
                  aria-label={t('window.less')}
                  aria-disabled={quantity <= 1}
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className={QUANTITY_BUTTON_CLASS}
                >
                  −
                </button>
                <output
                  aria-live="polite"
                  className="w-7 text-center font-digits text-xl font-bold"
                >
                  {quantity}
                </output>
                <button
                  type="button"
                  aria-label={t('window.more')}
                  aria-disabled={quantity >= mostAtOnce}
                  onClick={() => setQuantity((current) => Math.min(mostAtOnce, current + 1))}
                  className={QUANTITY_BUTTON_CLASS}
                >
                  +
                </button>
              </fieldset>
            )}
            <span className="flex items-center gap-1.5 font-digits text-lg font-bold">
              <CoinIcon />
              {t('window.coins', { count: total })}
            </span>
            <button
              ref={buyButton}
              type="button"
              onClick={buy}
              // Not `disabled`, which would take the focus away from the keyboard.
              aria-disabled={isBuying || refusal !== null}
              aria-describedby={refusal ? 'shop-refusal' : undefined}
              className={`ml-auto -rotate-1 cursor-pointer ui-paper-button px-5 pt-1.5 pb-1 text-xl text-ui-paper outline-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-dashed focus-visible:outline-ui-ink aria-disabled:cursor-not-allowed ${
                refusal ? 'bg-[#b9b1a3]' : 'bg-ui-stamp'
              }`}
            >
              {t('window.buy')}
            </button>
          </div>
          {refusal && (
            <p id="shop-refusal" className="text-right text-ui-danger">
              {t(refusal)}
            </p>
          )}
        </section>
      </div>
    </TornPaper>
  );
}
