// What changed in the game, told to the players in the "What's new?" sheet. Each note's text lives
// in the translations under `News.items.<key>`. A change players can see gets its note in the pull
// request that makes it: new notes go at the end, with the next id, and an id never changes, as
// browsers keep the last one they showed.
export type NewsKind = 'feature' | 'fix';

export type NewsItem = {
  id: number;
  key: string;
  // The day it reached the game, as YYYY-MM-DD.
  date: string;
  kind: NewsKind;
  // Kept at the top of the sheet, above everything else, until the pin is taken out.
  isPinned?: boolean;
};

export const NEWS: readonly NewsItem[] = [
  { id: 1, key: 'versionBadge', date: '2026-11-06', kind: 'feature' },
  { id: 2, key: 'passwordEye', date: '2026-11-06', kind: 'feature' },
  { id: 3, key: 'binderNeeded', date: '2026-11-06', kind: 'fix' },
  { id: 4, key: 'singleBoosterCut', date: '2026-11-07', kind: 'fix' },
  { id: 5, key: 'dialogFocus', date: '2026-11-07', kind: 'fix' },
  { id: 6, key: 'dalgonaFreeze', date: '2026-11-07', kind: 'fix' },
  { id: 7, key: 'dalgonaGiveUp', date: '2026-11-07', kind: 'fix' },
  { id: 8, key: 'setLogos', date: '2026-11-07', kind: 'fix' },
  { id: 9, key: 'everySetOnSale', date: '2026-11-07', kind: 'feature', isPinned: true },
  { id: 10, key: 'newsSheet', date: '2026-11-07', kind: 'feature' },
  { id: 11, key: 'ramenShop', date: '2026-11-07', kind: 'feature' },
  { id: 12, key: 'anySixQuests', date: '2026-11-07', kind: 'feature' },
  { id: 13, key: 'dojo', date: '2026-11-08', kind: 'feature' },
  { id: 14, key: 'parkQuests', date: '2026-11-08', kind: 'feature' },
  { id: 15, key: 'villageQuests', date: '2026-11-08', kind: 'feature' },
  { id: 16, key: 'painterKittenPhotos', date: '2026-11-08', kind: 'feature' },
  { id: 17, key: 'keyboardShortcuts', date: '2026-11-09', kind: 'feature' },
  { id: 18, key: 'mobileActionPrompt', date: '2026-11-09', kind: 'fix' },
  { id: 19, key: 'freezeLastMove', date: '2026-11-09', kind: 'feature' },
  { id: 20, key: 'lowStones', date: '2026-11-10', kind: 'feature' },
  { id: 21, key: 'reachableStars', date: '2026-11-10', kind: 'fix' },
  { id: 22, key: 'boosterLots', date: '2026-11-10', kind: 'feature' },
  { id: 23, key: 'clearShiftEnd', date: '2026-11-12', kind: 'fix' },
  { id: 24, key: 'binderLastPage', date: '2026-11-12', kind: 'fix' },
  { id: 25, key: 'binderPageJump', date: '2026-11-12', kind: 'feature' },
  { id: 26, key: 'binderSwitch', date: '2026-11-12', kind: 'feature' },
  { id: 27, key: 'summaryNewTag', date: '2026-11-13', kind: 'feature' },
  { id: 28, key: 'passwordReset', date: '2026-11-13', kind: 'feature' },
  { id: 29, key: 'paperMenus', date: '2026-11-13', kind: 'feature' },
  { id: 30, key: 'quickQuantity', date: '2026-11-14', kind: 'feature' },
];

// A player who never saw the sheet only gets the latest notes, rather than the whole history.
export const FIRST_VISIT_NEWS = 3;

export function latestNewsId(news: readonly NewsItem[] = NEWS): number {
  return news.reduce((latest, { id }) => Math.max(latest, id), 0);
}

// The notes a player hasn't seen yet, from the id of the last one they were shown, or null if the
// sheet never showed them anything.
export function unreadNews(
  lastSeenId: number | null,
  news: readonly NewsItem[] = NEWS,
): NewsItem[] {
  const newestFirst = [...news].sort((a, b) => b.id - a.id);
  return lastSeenId === null
    ? newestFirst.slice(0, FIRST_VISIT_NEWS)
    : newestFirst.filter(({ id }) => id > lastSeenId);
}

// What the sheet shows: the pinned notes first, always, then the others it is showing, grouped
// by day, newest first.
export function newsSheet(
  shown: readonly NewsItem[],
  news: readonly NewsItem[] = NEWS,
): { pinned: NewsItem[]; days: { date: string; items: NewsItem[] }[] } {
  const pinned = news.filter(({ isPinned }) => isPinned).sort((a, b) => b.id - a.id);
  const days: { date: string; items: NewsItem[] }[] = [];
  for (const item of [...shown].filter(({ isPinned }) => !isPinned).sort((a, b) => b.id - a.id)) {
    const day = days.find(({ date }) => date === item.date);
    if (day) {
      day.items.push(item);
    } else {
      days.push({ date: item.date, items: [item] });
    }
  }
  days.sort((a, b) => b.date.localeCompare(a.date));
  return { pinned, days };
}

// The id kept in the browser, which may be missing, from another version, or written by hand.
export function parseLastSeenId(value: string | null): number | null {
  if (value === null || value.trim() === '') {
    return null;
  }
  const id = Number(value);
  return Number.isInteger(id) && id >= 0 ? id : null;
}
