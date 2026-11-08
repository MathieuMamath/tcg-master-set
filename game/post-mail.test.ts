import { describe, expect, test } from 'vitest';
import {
  canFile,
  EXPRESS_MS,
  isOnCounter,
  MAIL_MISTAKE_LIMIT,
  type Mail,
  mailBag,
  PIGEONHOLES,
  SLIDE_MS,
  simulateMail,
} from './post-mail';
import { perfectMail } from './village-games.test-helpers';

const SEED = 20261108;

describe('the mail', () => {
  test('is the same for the same seed, and waits less as the shift goes on', () => {
    const bag = mailBag(SEED);
    expect(bag).toEqual(mailBag(SEED));
    expect(bag.slice(0, 3).every(({ kind }) => kind === 'letter')).toBe(true);
    expect(bag.at(-1)?.window).toBeLessThan(bag[0].window + 600);
  });
});

describe('a shift', () => {
  const bag: Mail[] = [
    { to: 'leaf', kind: 'letter', window: 3000 },
    { to: 'book', kind: 'express', window: 3000 },
    { to: 'house', kind: 'parcel', window: 3000 },
    { to: 'bowl', kind: 'letter', window: 3000 },
  ];
  const leaf = PIGEONHOLES.indexOf('leaf');
  const book = PIGEONHOLES.indexOf('book');
  const house = PIGEONHOLES.indexOf('house');

  test('files a letter once it is on the counter', () => {
    const sliding = simulateMail(SEED, [], 100, bag);
    expect(sliding && isOnCounter(sliding)).toBe(false);
    expect(sliding && canFile(sliding, bag, leaf)).toBe(false);
    const state = simulateMail(SEED, [[500, leaf]], 600, bag);
    expect(state?.score).toBe(1);
    expect(state?.current).toBe(1);
  });

  test('scores an express double when quick, and a parcel after two presses', () => {
    const quick = SLIDE_MS * 2 + 500;
    const express = simulateMail(
      SEED,
      [
        [500, leaf],
        [quick, book],
      ],
      quick + 100,
      bag,
    );
    expect(express?.score).toBe(3);
    const slow = 500 + SLIDE_MS + EXPRESS_MS + 200;
    const late = simulateMail(
      SEED,
      [
        [500, leaf],
        [slow, book],
      ],
      slow + 100,
      bag,
    );
    expect(late?.score).toBe(2);
    const parcel = simulateMail(
      SEED,
      [
        [500, leaf],
        [quick, book],
        [quick + SLIDE_MS + 200, house],
        [quick + SLIDE_MS + 400, house],
      ],
      quick + SLIDE_MS + 500,
      bag,
    );
    expect(parcel?.score).toBe(5);
  });

  test(`counts the wrong pigeonhole and a letter slipping off as mistakes, ${MAIL_MISTAKE_LIMIT} ending the shift`, () => {
    const wrong = simulateMail(SEED, [[500, book]], 600, bag);
    expect(wrong?.mistakes).toBe(1);
    const slipped = simulateMail(SEED, [], 45_000);
    expect(slipped?.mistakes).toBe(MAIL_MISTAKE_LIMIT);
    expect(slipped?.endedAt).not.toBeNull();
  });

  test('a perfect sorter makes no mistake', () => {
    const state = simulateMail(SEED, perfectMail(SEED), 45_000);
    expect(state?.mistakes).toBe(0);
    expect(state?.endedAt).toBeNull();
  });
});
