// Helping in Ramen Yuzu's kitchen: bowls come along a conveyor belt, each with its ticket of
// ingredients. While a bowl crosses the zone under the six bins, its ingredients go in, in any
// order: a bowl filled before it leaves the zone is served, with a bonus when quick. A wrong
// ingredient spoils it, and a bowl that leaves the zone unfinished falls off: those are mistakes.
// The belt goes faster as the shift goes on.
//
// Everything follows from the seed and the presses, so that the browser draws the same shift the
// server plays again: `simulateKitchen` is both.

import { seededRandom } from '../../seeded-random';
import type { ShiftAction } from './shifts';

export const KITCHEN_INGREDIENTS = ['noodles', 'miso', 'tofu', 'egg', 'onion', 'mushroom'] as const;
export type KitchenIngredient = (typeof KITCHEN_INGREDIENTS)[number];

// How long the next bowl takes to slide under the bins.
export const SLIDE_MS = 350;
export const KITCHEN_MISTAKE_LIMIT = 3;

export type KitchenOrder = {
  ingredients: KitchenIngredient[];
  // How long the bowl takes to cross the zone.
  window: number;
};

// Every order has the noodles and one to three toppings, all different, and less time to fill as
// the shift goes on.
export function kitchenOrders(seed: number, count = 120): KitchenOrder[] {
  const random = seededRandom(seed ^ 0xc00c);
  const toppings = KITCHEN_INGREDIENTS.filter((ingredient) => ingredient !== 'noodles');
  return Array.from({ length: count }, (_, index) => {
    const left = [...toppings];
    const ingredients: KitchenIngredient[] = ['noodles'];
    const size = 1 + Math.min(2, Math.floor(random() * (index < 4 ? 2 : 3)));
    for (let added = 0; added < size; added++) {
      const chosen = left[Math.floor(random() * left.length) % left.length];
      left.splice(left.indexOf(chosen), 1);
      ingredients.push(chosen);
    }
    return { ingredients, window: Math.max(3200, 7200 - index * 170) };
  });
}

export type KitchenMoment = {
  kind: 'added' | 'served' | 'quick' | 'spoiled' | 'dropped';
  at: number;
  ingredient?: KitchenIngredient;
};

export type KitchenState = {
  now: number;
  order: number;
  // When the bowl came under the bins.
  enteredAt: number;
  added: KitchenIngredient[];
  served: number;
  quick: number;
  mistakes: number;
  streak: number;
  moments: KitchenMoment[];
  endedAt: number | null;
};

function freshKitchen(): KitchenState {
  return {
    now: 0,
    order: 0,
    enteredAt: SLIDE_MS,
    added: [],
    served: 0,
    quick: 0,
    mistakes: 0,
    streak: 0,
    moments: [],
    endedAt: null,
  };
}

export function kitchenPoints(state: Pick<KitchenState, 'served' | 'quick'>): number {
  return state.served + state.quick;
}

// Whether the bowl is under the bins, rather than still sliding in.
export function isBowlInZone(state: KitchenState): boolean {
  return state.now >= state.enteredAt;
}

function nextBowl(state: KitchenState, at: number) {
  state.order += 1;
  state.added = [];
  state.enteredAt = at + SLIDE_MS;
}

function addMistake(state: KitchenState, kind: 'spoiled' | 'dropped', at: number) {
  state.mistakes += 1;
  state.streak = 0;
  state.moments.push({ kind, at });
  if (state.mistakes >= KITCHEN_MISTAKE_LIMIT && state.endedAt === null) {
    state.endedAt = at;
  }
}

// Plays the belt on until `to`: a bowl that leaves the zone unfinished falls off.
function advance(state: KitchenState, orders: KitchenOrder[], to: number) {
  for (;;) {
    if (state.endedAt !== null) {
      state.now = Math.min(to, state.endedAt);
      return;
    }
    const leavesAt = state.enteredAt + orders[state.order].window;
    if (leavesAt > to) {
      state.now = to;
      return;
    }
    state.now = leavesAt;
    addMistake(state, 'dropped', leavesAt);
    nextBowl(state, leavesAt);
  }
}

function addIngredient(
  state: KitchenState,
  orders: KitchenOrder[],
  ingredient: KitchenIngredient,
): boolean {
  if (!isBowlInZone(state) || state.endedAt !== null) {
    return false;
  }
  const at = state.now;
  const order = orders[state.order];
  if (!order.ingredients.includes(ingredient) || state.added.includes(ingredient)) {
    addMistake(state, 'spoiled', at);
    nextBowl(state, at);
    return true;
  }
  state.added.push(ingredient);
  state.moments.push({ kind: 'added', at, ingredient });
  if (state.added.length === order.ingredients.length) {
    state.served += 1;
    state.streak += 1;
    state.moments.push({ kind: 'served', at });
    if (at - state.enteredAt <= order.window / 2) {
      state.quick += 1;
      state.moments.push({ kind: 'quick', at });
    }
    nextBowl(state, at);
  }
  return true;
}

export function simulateKitchen(
  seed: number,
  presses: readonly ShiftAction[],
  until: number,
  orders: KitchenOrder[] = kitchenOrders(seed),
): KitchenState | null {
  const state = freshKitchen();
  for (const [ms, choice] of presses) {
    advance(state, orders, ms);
    if (!addIngredient(state, orders, KITCHEN_INGREDIENTS[choice])) {
      return null;
    }
  }
  advance(state, orders, Math.max(until, state.now));
  return state;
}
