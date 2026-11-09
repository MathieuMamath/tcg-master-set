// Waiting tables at Ramen Yuzu, as a little restaurant that gets busy: the village's folk queue at
// the door, sit at one of four tables as soon as one is clean, and order a bowl, which comes out
// of the kitchen onto the pass. The bowl at the front of the pass is the one in hand. Touching a
// table either clears it, once its guest has eaten and gone, or brings it the bowl in hand: the
// right guest is served, and tips when served quickly; anyone else is a mistake. A guest left
// waiting too long leaves angry. Guests come faster and wait less as the shift goes on.
//
// Everything follows from the seed and the presses, so that the browser draws the same shift the
// server plays again: `simulateService` is both.

import { seededRandom } from '../../seeded-random';
import type { ShiftAction } from './shifts';

export const SERVICE_TABLES = 4;
export const SERVICE_DISHES = ['shoyu', 'miso', 'curry', 'veggie'] as const;
export type ServiceDish = (typeof SERVICE_DISHES)[number];

// The village's folk, by the ids their portraits have.
export const SERVICE_GUESTS = [
  'grandma',
  'grandpa',
  'boy',
  'gaspard',
  'berenice',
  'brutus',
  'hulotte',
  'trotte',
  'binderSeller',
  'latest',
  'thisYear',
  'older',
] as const;
export type ServiceGuestLook = (typeof SERVICE_GUESTS)[number];

// How long a served guest eats before leaving their table to clear, and how long an angry guest
// takes to storm out.
export const EAT_MS = 2200;
export const STORM_OUT_MS = 700;
// The mistakes after which the shift is over: wrong tables and angry guests alike.
export const SERVICE_MISTAKE_LIMIT = 3;

export type Guest = {
  // When the guest comes in, to sit as soon as a table is clean and free.
  arrivesAt: number;
  dish: ServiceDish;
  look: ServiceGuestLook;
  // How long the kitchen takes with the bowl.
  cookMs: number;
  // How long the guest waits for the bowl, once seated.
  patience: number;
};

// The first guests come in together, to get the shift going at once.
const OPENING_GUESTS = [0, 250, 600, 1100];

// The shift's guests: more often, and less patient, as it goes on.
export function serviceGuests(seed: number, count = 90): Guest[] {
  const random = seededRandom(seed ^ 0x5eed);
  let arrivesAt = 0;
  return Array.from({ length: count }, (_, index) => {
    arrivesAt =
      index < OPENING_GUESTS.length
        ? OPENING_GUESTS[index]
        : arrivesAt + Math.max(600, 1600 - index * 30) + Math.floor(random() * 500);
    return {
      arrivesAt,
      dish: SERVICE_DISHES[Math.floor(random() * SERVICE_DISHES.length) % SERVICE_DISHES.length],
      look: SERVICE_GUESTS[Math.floor(random() * SERVICE_GUESTS.length) % SERVICE_GUESTS.length],
      cookMs: 1000 + Math.floor(random() * 1200),
      patience: Math.max(6000, 12000 - index * 110),
    };
  });
}

export type Seat = {
  guest: number;
  seatedAt: number;
  // Waiting for the bowl, eating it, gone leaving the table to clear, or storming out.
  outcome: 'waiting' | 'eating' | 'dirty' | 'angry';
  // When eating ends, or the angry guest is out of the door.
  until: number | null;
};

export type PassDish = { dish: ServiceDish; readyAt: number };

// Something that happened, for the scene to show: where and when.
export type ServiceMoment = {
  kind: 'served' | 'tip' | 'cleared' | 'angry' | 'wrong';
  table: number;
  at: number;
};

export type ServiceState = {
  now: number;
  tables: (Seat | null)[];
  // The guests who came in and wait at the door, by their index.
  queue: number[];
  nextGuest: number;
  // The bowls out of the kitchen, oldest first: the first ready one is in hand.
  pass: PassDish[];
  served: number;
  tips: number;
  mistakes: number;
  // Served without a mistake in between.
  streak: number;
  moments: ServiceMoment[];
  // When the last mistake ended the shift, if it did.
  endedAt: number | null;
};

export function freshService(): ServiceState {
  return {
    now: 0,
    tables: Array.from({ length: SERVICE_TABLES }, () => null),
    queue: [],
    nextGuest: 0,
    pass: [],
    served: 0,
    tips: 0,
    mistakes: 0,
    streak: 0,
    moments: [],
    endedAt: null,
  };
}

// The points a shift scores: each guest served, and each tip.
export function servicePoints(state: Pick<ServiceState, 'served' | 'tips'>): number {
  return state.served + state.tips;
}

// The bowl in hand: the oldest on the pass that is ready.
export function dishInHand(state: ServiceState): PassDish | null {
  return state.pass.find(({ readyAt }) => readyAt <= state.now) ?? null;
}

function addMistake(state: ServiceState, moment: ServiceMoment) {
  state.mistakes += 1;
  state.streak = 0;
  state.moments.push(moment);
  if (state.mistakes >= SERVICE_MISTAKE_LIMIT && state.endedAt === null) {
    state.endedAt = moment.at;
  }
}

// Takes one bowl of a dish off the pass, the newest, when an angry guest no longer needs it: the
// pass never holds more of a dish than the guests waiting for it.
function dropSpareDish(state: ServiceState, guests: Guest[], dish: ServiceDish) {
  const waiting = state.tables.filter(
    (seat) => seat?.outcome === 'waiting' && guests[seat.guest].dish === dish,
  ).length;
  const onPass = state.pass.filter((item) => item.dish === dish).length;
  if (onPass > waiting) {
    state.pass.splice(state.pass.map((item) => item.dish).lastIndexOf(dish), 1);
  }
}

// The first at the door sit at the free tables, and the kitchen starts their bowls.
function seatGuests(state: ServiceState, guests: Guest[], at: number) {
  state.tables.forEach((seat, table) => {
    if (!seat && state.queue.length > 0) {
      const guest = state.queue.shift() as number;
      state.tables[table] = { guest, seatedAt: at, outcome: 'waiting', until: null };
      state.pass.push({ dish: guests[guest].dish, readyAt: at + guests[guest].cookMs });
    }
  });
  state.pass.sort((a, b) => a.readyAt - b.readyAt);
}

// Plays the restaurant on until `to`: guests coming in, sitting down, finishing their bowls,
// getting angry and leaving, in the order it happens.
function advance(state: ServiceState, guests: Guest[], to: number) {
  for (;;) {
    if (state.endedAt !== null) {
      state.now = Math.min(to, state.endedAt);
      return;
    }
    const times: number[] = [];
    if (state.nextGuest < guests.length) {
      times.push(guests[state.nextGuest].arrivesAt);
    }
    for (const seat of state.tables) {
      if (seat?.outcome === 'waiting') {
        times.push(seat.seatedAt + guests[seat.guest].patience);
      } else if (seat && seat.until !== null) {
        times.push(seat.until);
      }
    }
    const next = Math.min(...times);
    if (!Number.isFinite(next) || next > to) {
      state.now = to;
      return;
    }
    state.now = next;
    while (state.nextGuest < guests.length && guests[state.nextGuest].arrivesAt <= next) {
      state.queue.push(state.nextGuest);
      state.nextGuest += 1;
    }
    state.tables.forEach((seat, table) => {
      if (seat?.outcome === 'waiting' && seat.seatedAt + guests[seat.guest].patience <= next) {
        seat.outcome = 'angry';
        seat.until = next + STORM_OUT_MS;
        dropSpareDish(state, guests, guests[seat.guest].dish);
        addMistake(state, { kind: 'angry', table, at: next });
      }
    });
    state.tables.forEach((seat, table) => {
      if (seat && seat.until !== null && seat.until <= next) {
        if (seat.outcome === 'eating') {
          // Done eating: the guest goes, and the table waits to be cleared.
          seat.outcome = 'dirty';
          seat.until = null;
        } else if (seat.outcome === 'angry') {
          // Gone without eating: the table is still clean.
          state.tables[table] = null;
        }
      }
    });
    seatGuests(state, guests, next);
  }
}

// Touching a table: clearing it once its guest is gone, or bringing it the bowl in hand. False
// when the touch can't do anything, with no bowl in hand and nothing to clear, which the browser
// never sends.
function touchTable(state: ServiceState, guests: Guest[], table: number): boolean {
  const seat = state.tables[table];
  if (seat?.outcome === 'dirty') {
    state.tables[table] = null;
    state.moments.push({ kind: 'cleared', table, at: state.now });
    seatGuests(state, guests, state.now);
    return true;
  }
  const hand = dishInHand(state);
  if (!hand) {
    return false;
  }
  if (seat?.outcome !== 'waiting' || guests[seat.guest].dish !== hand.dish) {
    addMistake(state, { kind: 'wrong', table, at: state.now });
    return true;
  }
  state.pass.splice(state.pass.indexOf(hand), 1);
  seat.outcome = 'eating';
  seat.until = state.now + EAT_MS;
  state.served += 1;
  state.streak += 1;
  state.moments.push({ kind: 'served', table, at: state.now });
  if (state.now - seat.seatedAt <= guests[seat.guest].patience / 2) {
    state.tips += 1;
    state.moments.push({ kind: 'tip', table, at: state.now });
  }
  return true;
}

// Whether touching the table now would do something, for the browser to send only those.
export function canTouchTable(state: ServiceState, table: number): boolean {
  return state.tables[table]?.outcome === 'dirty' || dishInHand(state) !== null;
}

// The shift as it stands at `until`, from its seed and the presses so far, or null if a press
// can't have happened: doing nothing, after the shift ended, or out of order.
export function simulateService(
  seed: number,
  presses: readonly ShiftAction[],
  until: number,
  guests: Guest[] = serviceGuests(seed),
): ServiceState | null {
  const state = freshService();
  for (const [ms, table] of presses) {
    advance(state, guests, ms);
    if (state.endedAt !== null || !touchTable(state, guests, table)) {
      return null;
    }
  }
  advance(state, guests, Math.max(until, state.now));
  return state;
}
