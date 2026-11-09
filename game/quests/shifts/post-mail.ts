// Sorting the mail at Gustave's post stand: letters slide onto his counter one at a time, each with
// a stamp showing where it goes, a house, a bowl, a leaf or a book, and a press files it in the
// matching pigeonhole. An express letter, edged in red, scores double when filed quickly. A parcel
// takes two presses on its pigeonhole. The wrong pigeonhole, or a letter left until it slips off the
// counter, is a mistake. The letters come quicker as the shift goes on.
//
// Everything follows from the seed and the presses, so that the browser draws the same shift the
// server plays again: `simulateMail` is both. A press is a pigeonhole, from 0 to 3.

import { seededRandom } from '../../seeded-random';
import type { ShiftAction } from './shifts';

export const PIGEONHOLES = ['house', 'bowl', 'leaf', 'book'] as const;
export type Pigeonhole = (typeof PIGEONHOLES)[number];
export const MAIL_KINDS = ['letter', 'express', 'parcel'] as const;
export type MailKind = (typeof MAIL_KINDS)[number];
export const MAIL_MISTAKE_LIMIT = 3;
// How long the next letter takes to slide onto the counter, and how quick an express must be.
export const SLIDE_MS = 300;
export const EXPRESS_MS = 1200;

export type Mail = {
  to: Pigeonhole;
  kind: MailKind;
  // How long it waits on the counter before it slips off.
  window: number;
};

// The mail, waiting less long as the shift goes on, with express letters and parcels now and then.
export function mailBag(seed: number, count = 400): Mail[] {
  const random = seededRandom(seed ^ 0x9057);
  return Array.from({ length: count }, (_, index) => {
    const roll = random();
    const kind: MailKind =
      index < 3 ? 'letter' : roll < 0.18 ? 'express' : roll < 0.32 ? 'parcel' : 'letter';
    return {
      to: PIGEONHOLES[Math.floor(random() * PIGEONHOLES.length)],
      kind,
      window: Math.max(1500, 3200 - index * 45) + (kind === 'parcel' ? 600 : 0),
    };
  });
}

export type MailMoment = {
  kind: 'filed' | 'express' | 'parcel' | 'half' | 'wrong' | 'slipped';
  at: number;
  mail: number;
};

export type MailState = {
  now: number;
  // The letter on the counter, by its index, and when it came.
  current: number;
  arrivedAt: number;
  // A parcel's first press, on its pigeonhole.
  isHalfFiled: boolean;
  score: number;
  mistakes: number;
  moments: MailMoment[];
  endedAt: number | null;
};

function freshMail(): MailState {
  return {
    now: 0,
    current: 0,
    arrivedAt: SLIDE_MS,
    isHalfFiled: false,
    score: 0,
    mistakes: 0,
    moments: [],
    endedAt: null,
  };
}

export function mailPoints(state: Pick<MailState, 'score'>): number {
  return state.score;
}

// Whether the letter is on the counter, rather than still sliding on.
export function isOnCounter(state: MailState): boolean {
  return state.now >= state.arrivedAt;
}

function nextLetter(state: MailState, at: number) {
  state.current += 1;
  state.arrivedAt = at + SLIDE_MS;
  state.isHalfFiled = false;
}

function addMistake(state: MailState, kind: 'wrong' | 'slipped', at: number) {
  state.mistakes += 1;
  state.moments.push({ kind, at, mail: state.current });
  if (state.mistakes >= MAIL_MISTAKE_LIMIT && state.endedAt === null) {
    state.endedAt = at;
  }
  nextLetter(state, at);
}

// Plays the counter on until `to`: a letter left too long slips off.
function advance(state: MailState, bag: readonly Mail[], to: number) {
  for (;;) {
    if (state.endedAt !== null) {
      state.now = Math.min(to, state.endedAt);
      return;
    }
    if (state.current >= bag.length) {
      state.now = to;
      return;
    }
    const slipsAt = state.arrivedAt + bag[state.current].window;
    if (slipsAt > to) {
      state.now = to;
      return;
    }
    state.now = slipsAt;
    addMistake(state, 'slipped', slipsAt);
  }
}

// Whether a press would do something now, for the browser to send only those.
export function canFile(state: MailState, bag: readonly Mail[], choice: number): boolean {
  return (
    state.endedAt === null &&
    isOnCounter(state) &&
    state.current < bag.length &&
    Number.isInteger(choice) &&
    choice >= 0 &&
    choice < PIGEONHOLES.length
  );
}

function file(state: MailState, bag: readonly Mail[], choice: number): boolean {
  if (!canFile(state, bag, choice)) {
    return false;
  }
  const at = state.now;
  const mail = bag[state.current];
  if (PIGEONHOLES[choice] !== mail.to) {
    addMistake(state, 'wrong', at);
    return true;
  }
  if (mail.kind === 'parcel' && !state.isHalfFiled) {
    state.isHalfFiled = true;
    state.moments.push({ kind: 'half', at, mail: state.current });
    return true;
  }
  const isQuickExpress = mail.kind === 'express' && at - state.arrivedAt <= EXPRESS_MS;
  const points = mail.kind === 'parcel' || isQuickExpress ? 2 : 1;
  state.score += points;
  state.moments.push({
    kind: mail.kind === 'parcel' ? 'parcel' : isQuickExpress ? 'express' : 'filed',
    at,
    mail: state.current,
  });
  nextLetter(state, at);
  return true;
}

export function simulateMail(
  seed: number,
  presses: readonly ShiftAction[],
  until: number,
  bag: readonly Mail[] = mailBag(seed),
): MailState | null {
  const state = freshMail();
  for (const [ms, choice] of presses) {
    advance(state, bag, ms);
    if (!file(state, bag, choice)) {
      return null;
    }
  }
  advance(state, bag, Math.max(until, state.now));
  return state;
}
