import { useEffect, useState } from 'react';
import { latestNewsId, NEWS, type NewsItem, parseLastSeenId, unreadNews } from '@/game/news';

// Where the browser keeps the id of the last "What's new?" note it showed.
const NEWS_SEEN_KEY = 'tcg-master-set:news-seen';

// The "What's new?" sheet, with the notes it tells besides the pinned ones. On arrival, it tells
// what changed since the last note this browser showed. Kept in the browser only: another device,
// or cleared site data, shows the recent notes again.
export function useNews() {
  const [newsShown, setNewsShown] = useState<readonly NewsItem[] | null>(null);

  useEffect(() => {
    try {
      const unread = unreadNews(parseLastSeenId(localStorage.getItem(NEWS_SEEN_KEY)));
      if (unread.length > 0) {
        setNewsShown(unread);
      }
    } catch {
      // No storage, such as in a private window: the sheet stays in the settings.
    }
  }, []);

  const closeNews = () => {
    setNewsShown(null);
    try {
      localStorage.setItem(NEWS_SEEN_KEY, String(latestNewsId()));
    } catch {
      // Without storage, the next visit tells the news again.
    }
  };

  // Every note, from the settings menu.
  const showAllNews = () => setNewsShown(NEWS);

  return { newsShown, closeNews, showAllNews };
}
