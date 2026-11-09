// Washing up at Ramen Yuzu: dirty bowls pile up in the tub, faster and faster. The bowl in the
// sink is scrubbed once for each stain, rinsed, then stacked on a pile that grows shakier with each
// bowl. The pile scores once carried to Yuzu, with a bonus for a tall one, but a tall pile may
// topple, and while it is carried the tub keeps filling. Rinsing a stained bowl or stacking an
// unrinsed one makes it slip and break, and so does a tub that overflows: those are mistakes.
//
// Everything follows from the seed and the presses, so that the browser draws the same shift the
// server plays again: `simulateDishes` is both.

import { seededRandom } from '../../seeded-random';
import type { ShiftAction } from './shifts';

export const DISH_ACTIONS = ['scrub', 'rinse', 'stack', 'deliver'] as const;
export type DishAction = (typeof DISH_ACTIONS)[number];

// The bowls the tub holds besides the one in the sink: one more breaks.
export const TUB_LIMIT = 8;
// How long carrying the pile to Yuzu takes, while nothing else can be done.
export const CARRY_MS = 900;
export const DISHES_MISTAKE_LIMIT = 3;
// From this height on, each bowl stacked may bring the pile down.
const STEADY_PILE = 5;
const TOPPLE_STEP = 0.06;

export type DirtyBowl = { arrivesAt: number; stains: 1 | 2 | 3 };

// The first bowls are waiting already, then more come, faster and faster.
const OPENING_BOWLS = 3;

export function dirtyBowls(seed: number, count = 120): DirtyBowl[] {
  const random = seededRandom(seed ^ 0xd15e);
  let arrivesAt = 0;
  return Array.from({ length: count }, (_, index) => {
    if (index >= OPENING_BOWLS) {
      arrivesAt += Math.max(900, 2600 - index * 45) + Math.floor(random() * 400);
    }
    const roll = random();
    return { arrivesAt, stains: roll < 0.4 ? 1 : roll < 0.8 ? 2 : 3 };
  });
}

// The chances of the pile toppling, one roll for each bowl stacked, from the seed.
function toppleRolls(seed: number, count = 200): number[] {
  const random = seededRandom(seed ^ 0x7099);
  return Array.from({ length: count }, () => random());
}

// The bonus a pile earns once carried to Yuzu, by its height.
export function pileBonus(height: number): number {
  return height >= 9 ? 10 : height >= 7 ? 6 : height >= 5 ? 3 : height >= 3 ? 1 : 0;
}

// The chance a pile this high topples when one more bowl lands on it.
export function toppleChance(height: number): number {
  return Math.max(0, (height - STEADY_PILE) * TOPPLE_STEP);
}

export type DishesMoment = {
  kind: 'scrubbed' | 'rinsed' | 'stacked' | 'delivered' | 'toppled' | 'broke' | 'overflow';
  at: number;
  // The pile's height for a delivery or a fall, the bonus for a delivery.
  count?: number;
  bonus?: number;
};

export type DishesState = {
  now: number;
  // The bowls waiting, the first in the sink, by their index.
  tub: number[];
  nextBowl: number;
  stainsLeft: number;
  isRinsed: boolean;
  pile: number;
  // Until when the player is away carrying the pile.
  carryingUntil: number | null;
  banked: number;
  bonus: number;
  stacked: number;
  mistakes: number;
  moments: DishesMoment[];
  endedAt: number | null;
};

function freshDishes(): DishesState {
  return {
    now: 0,
    tub: [],
    nextBowl: 0,
    stainsLeft: 0,
    isRinsed: false,
    pile: 0,
    carryingUntil: null,
    banked: 0,
    bonus: 0,
    stacked: 0,
    mistakes: 0,
    moments: [],
    endedAt: null,
  };
}

export function dishesPoints(state: Pick<DishesState, 'banked' | 'bonus'>): number {
  return state.banked + state.bonus;
}

function addMistake(state: DishesState, kind: 'broke' | 'overflow', at: number) {
  state.mistakes += 1;
  state.moments.push({ kind, at });
  if (state.mistakes >= DISHES_MISTAKE_LIMIT && state.endedAt === null) {
    state.endedAt = at;
  }
}

// The next bowl slides into the sink, with its stains to scrub.
function nextInSink(state: DishesState, bowls: DirtyBowl[]) {
  state.tub.shift();
  state.isRinsed = false;
  state.stainsLeft = state.tub.length > 0 ? bowls[state.tub[0]].stains : 0;
}

function advance(state: DishesState, bowls: DirtyBowl[], to: number) {
  for (;;) {
    if (state.endedAt !== null) {
      state.now = Math.min(to, state.endedAt);
      return;
    }
    const times: number[] = [];
    if (state.nextBowl < bowls.length) {
      times.push(bowls[state.nextBowl].arrivesAt);
    }
    if (state.carryingUntil !== null) {
      times.push(state.carryingUntil);
    }
    const next = Math.min(...times);
    if (!Number.isFinite(next) || next > to) {
      state.now = to;
      return;
    }
    state.now = next;
    if (state.carryingUntil !== null && state.carryingUntil <= next) {
      state.carryingUntil = null;
    }
    while (state.nextBowl < bowls.length && bowls[state.nextBowl].arrivesAt <= next) {
      if (state.tub.length > TUB_LIMIT) {
        // No room left: the bowl lands on the others and breaks.
        addMistake(state, 'overflow', next);
      } else {
        state.tub.push(state.nextBowl);
        if (state.tub.length === 1) {
          state.stainsLeft = bowls[state.nextBowl].stains;
          state.isRinsed = false;
        }
      }
      state.nextBowl += 1;
      if (state.endedAt !== null) {
        return;
      }
    }
  }
}

// Whether a press would do something now, for the browser to send only those.
export function canDo(state: DishesState, action: DishAction): boolean {
  if (state.carryingUntil !== null || state.endedAt !== null) {
    return false;
  }
  return action === 'deliver' ? state.pile > 0 : state.tub.length > 0;
}

function act(state: DishesState, bowls: DirtyBowl[], rolls: number[], action: DishAction): boolean {
  if (!canDo(state, action)) {
    return false;
  }
  const at = state.now;
  if (action === 'deliver') {
    const height = state.pile;
    const bonus = pileBonus(height);
    state.banked += height;
    state.bonus += bonus;
    state.pile = 0;
    state.carryingUntil = at + CARRY_MS;
    state.moments.push({ kind: 'delivered', at, count: height, bonus });
  } else if (action === 'scrub') {
    if (state.stainsLeft > 0 && !state.isRinsed) {
      state.stainsLeft -= 1;
      state.moments.push({ kind: 'scrubbed', at });
    }
  } else if (action === 'rinse') {
    if (state.stainsLeft > 0) {
      addMistake(state, 'broke', at);
      nextInSink(state, bowls);
    } else {
      state.isRinsed = true;
      state.moments.push({ kind: 'rinsed', at });
    }
  } else if (!state.isRinsed) {
    addMistake(state, 'broke', at);
    nextInSink(state, bowls);
  } else {
    const roll = rolls[state.stacked % rolls.length];
    state.stacked += 1;
    nextInSink(state, bowls);
    if (roll < toppleChance(state.pile + 1)) {
      state.moments.push({ kind: 'toppled', at, count: state.pile + 1 });
      state.pile = 0;
    } else {
      state.pile += 1;
      state.moments.push({ kind: 'stacked', at });
    }
  }
  return true;
}

export function simulateDishes(
  seed: number,
  presses: readonly ShiftAction[],
  until: number,
  bowls: DirtyBowl[] = dirtyBowls(seed),
  rolls: number[] = toppleRolls(seed),
): DishesState | null {
  const state = freshDishes();
  for (const [ms, choice] of presses) {
    advance(state, bowls, ms);
    if (state.endedAt !== null || !act(state, bowls, rolls, DISH_ACTIONS[choice])) {
      return null;
    }
  }
  advance(state, bowls, Math.max(until, state.now));
  return state;
}
