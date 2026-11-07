'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { type NewsItem, newsSheet } from '@/game/news';
import { moveThroughChoices, openDialog } from './menu-focus';
import { CHOICE_CLASS, TornPaper } from './shop-dialog';

type Props = {
  // The notes to tell, besides the pinned ones that always come first.
  items: readonly NewsItem[];
  onClose: () => void;
};

// The kind of change, stamped beside each note.
function KindStamp({ kind }: { kind: NewsItem['kind'] }) {
  const t = useTranslations('News');
  return (
    <span
      className={`mt-0.5 shrink-0 -rotate-3 rounded-xs px-1.5 text-sm font-semibold ${
        kind === 'feature' ? 'bg-ui-accent text-ui-ink' : 'bg-[#3f8a6a] text-ui-paper'
      }`}
    >
      {t(kind)}
    </span>
  );
}

function Note({ item }: { item: NewsItem }) {
  const t = useTranslations('News');
  return (
    <li className="flex items-start gap-2.5">
      <KindStamp kind={item.kind} />
      {/* Each note only ever has its own text, which this type can't tell. */}
      <p className="leading-snug">{t(`items.${item.key}` as 'items.newsSheet')}</p>
    </li>
  );
}

// "What's new?": what changed in the game, the pinned notes first, then the others by day.
export function NewsSheet({ items, onClose }: Props) {
  const t = useTranslations('News');
  const format = useFormatter();
  const dialog = useRef<HTMLDialogElement>(null);
  const { pinned, days } = newsSheet(items);

  useEffect(() => {
    openDialog(dialog.current);
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="news-title"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto w-[min(34rem,calc(100%-1rem))] max-w-none overflow-visible bg-transparent font-game text-lg text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="px-4 pt-5 pb-5 sm:px-6">
        <h2 id="news-title" className="font-display text-2xl">
          {t('title')}
        </h2>
        <p className="text-ui-ink/70">{t('intro')}</p>
        <div className="mt-3 max-h-[calc(100dvh-14rem)] overflow-y-auto pr-1">
          {pinned.length > 0 && (
            <section className="rounded-sm border-2 border-dashed border-ui-stamp/50 bg-ui-accent/15 px-3 py-2">
              <h3 className="font-display text-ui-stamp">{t('pinned')}</h3>
              <ul className="mt-1.5 grid gap-2">
                {pinned.map((item) => (
                  <Note key={item.id} item={item} />
                ))}
              </ul>
            </section>
          )}
          {days.map(({ date, items: notes }) => (
            <section key={date} className="mt-3">
              <h3 className="border-b-2 border-dashed border-ui-ink/15 font-semibold text-ui-ink/70">
                {format.dateTime(new Date(`${date}T12:00:00Z`), { dateStyle: 'long' })}
              </h3>
              <ul className="mt-1.5 grid gap-2">
                {notes.map((item) => (
                  <Note key={item.id} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>
        <form method="dialog" className="mt-4 flex justify-end">
          <button type="submit" data-first-focus className={`${CHOICE_CLASS} bg-ui-accent!`}>
            {t('close')}
          </button>
        </form>
      </TornPaper>
    </dialog>
  );
}
