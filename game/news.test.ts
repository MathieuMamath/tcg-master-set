import { describe, expect, test } from 'vitest';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import {
  FIRST_VISIT_NEWS,
  latestNewsId,
  NEWS,
  type NewsItem,
  newsSheet,
  parseLastSeenId,
  unreadNews,
} from './news';

const note = (id: number, date: string, isPinned = false): NewsItem => ({
  id,
  key: `note${id}`,
  date,
  kind: 'fix',
  isPinned,
});

const SAMPLE = [
  note(1, '2026-01-01'),
  note(2, '2026-01-01'),
  note(3, '2026-01-02', true),
  note(4, '2026-01-03'),
  note(5, '2026-01-03'),
];

describe('the notes', () => {
  test('have ids that only ever grow, so that a browser can tell which are new', () => {
    NEWS.forEach(({ id }, index) => {
      expect(id).toBe(index + 1);
    });
  });

  test('each have a text in every language', () => {
    for (const messages of [en, fr]) {
      const items = (messages as { News: { items: Record<string, string> } }).News.items;
      for (const { key } of NEWS) {
        expect(items[key], key).toBeTypeOf('string');
      }
    }
  });

  test('have dates written as days', () => {
    for (const { date } of NEWS) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('unreadNews', () => {
  test('shows a first visit only the latest notes', () => {
    expect(unreadNews(null, SAMPLE).map(({ id }) => id)).toEqual([5, 4, 3]);
    expect(FIRST_VISIT_NEWS).toBe(3);
  });

  test('shows the notes added since the last one seen', () => {
    expect(unreadNews(3, SAMPLE).map(({ id }) => id)).toEqual([5, 4]);
  });

  test('shows nothing once the latest note was seen', () => {
    expect(unreadNews(latestNewsId(SAMPLE), SAMPLE)).toEqual([]);
  });
});

describe('newsSheet', () => {
  test('puts the pinned notes first, even when already read', () => {
    const sheet = newsSheet(unreadNews(3, SAMPLE), SAMPLE);

    expect(sheet.pinned.map(({ id }) => id)).toEqual([3]);
    expect(sheet.days).toEqual([
      { date: '2026-01-03', items: [note(5, '2026-01-03'), note(4, '2026-01-03')] },
    ]);
  });

  test('groups the rest by day, newest first, without the pinned notes', () => {
    const sheet = newsSheet(SAMPLE, SAMPLE);

    expect(sheet.days.map(({ date, items }) => [date, items.map(({ id }) => id)])).toEqual([
      ['2026-01-03', [5, 4]],
      ['2026-01-01', [2, 1]],
    ]);
  });
});

describe('parseLastSeenId', () => {
  test('reads a stored id', () => {
    expect(parseLastSeenId('7')).toBe(7);
  });

  test('ignores anything else', () => {
    for (const value of [null, '', 'abc', '-1', '2.5']) {
      expect(parseLastSeenId(value)).toBeNull();
    }
  });
});
