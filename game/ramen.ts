import { DISH_ACTIONS, dishesPoints, simulateDishes } from './ramen-dishes';
import { KITCHEN_INGREDIENTS, kitchenPoints, simulateKitchen } from './ramen-kitchen';
import { SERVICE_TABLES, servicePoints, simulateService } from './ramen-service';

// The ramen shop downtown, where the chef hires the player for three jobs: washing the bowls,
// helping in the kitchen, and waiting on the tables. Each is a short shift whose orders come from a
// seed, the moment the shift began, so that the server can find them again. The browser only sends
// what was pressed and when, and the server plays the shift again with the same rules to get the
// score. A shift pays once a day, the first time it earns something, in coins.

export const RAMEN_JOBS = ['dishes', 'kitchen', 'service'] as const;
export type RamenJob = (typeof RAMEN_JOBS)[number];

export const RAMEN_QUESTS = {
  dishes: 'ramen-dishes',
  kitchen: 'ramen-kitchen',
  service: 'ramen-service',
} as const satisfies Record<RamenJob, string>;

export type RamenQuestId = (typeof RAMEN_QUESTS)[RamenJob];

export function isRamenJob(value: unknown): value is RamenJob {
  return RAMEN_JOBS.some((job) => job === value);
}

// A press: when it happened in the shift, in milliseconds, and which button.
export type ShiftAction = readonly [ms: number, choice: number];

// The quickest two presses can follow each other: faster can only come from a script.
export const QUICKEST_PRESS_MS = 80;
// Room for the requests to travel, or for a hidden tab's slow timers.
const GRACE_SECONDS = 15;

// What a shift pays, by its score: nothing below the first step.
export type ShiftPay = { coins: number; score: number };

export type ShiftRules = {
  seconds: number;
  choices: number;
  // From the lowest score that pays, each step with its coins.
  pay: readonly ShiftPay[];
};

export const SHIFT_RULES: Record<RamenJob, ShiftRules> = {
  dishes: {
    seconds: 45,
    // Scrub, rinse, stack, and carry the pile to Yuzu.
    choices: DISH_ACTIONS.length,
    pay: [
      { score: 16, coins: 120 },
      { score: 28, coins: 200 },
    ],
  },
  kitchen: {
    seconds: 45,
    // One button per bin of ingredients.
    choices: KITCHEN_INGREDIENTS.length,
    pay: [
      { score: 20, coins: 120 },
      { score: 36, coins: 200 },
    ],
  },
  service: {
    seconds: 60,
    // One button per table.
    choices: SERVICE_TABLES,
    pay: [
      { score: 30, coins: 120 },
      { score: 55, coins: 200 },
    ],
  },
};

// The stars a shift earns: one for each step of pay, and a third for a shift well beyond.
export function shiftStars(job: RamenJob, score: number): 0 | 1 | 2 | 3 {
  const [first, second] = SHIFT_RULES[job].pay;
  if (score >= Math.round(second.score * 1.4)) {
    return 3;
  }
  return score >= second.score ? 2 : score >= first.score ? 1 : 0;
}

export function shiftCoins(job: RamenJob, score: number): number {
  return SHIFT_RULES[job].pay.reduce(
    (coins, step) => (score >= step.score ? step.coins : coins),
    0,
  );
}

// The seed the shift's orders come from, taken from the moment it began.
export function shiftSeed(startedAt: Date): number {
  return Math.floor(startedAt.getTime()) >>> 0;
}

// --- Playing a shift again, from what the browser sent. ----------------------------------------

export type ShiftResult = {
  score: number;
  mistakes: number;
  // When the shift ended: its full time, or the press that made the last mistake.
  endedAtMs: number;
};

// The score of a shift from its presses, or null if they can't have happened. The request comes
// from the browser, so it can be anything.
export function playShift(job: RamenJob, seed: number, actions: unknown): ShiftResult | null {
  const rules = SHIFT_RULES[job];
  const shiftMs = rules.seconds * 1000;
  if (!Array.isArray(actions) || actions.length > shiftMs / QUICKEST_PRESS_MS + 1) {
    return null;
  }
  let previous = Number.NEGATIVE_INFINITY;
  const presses: ShiftAction[] = [];
  for (const action of actions) {
    if (!Array.isArray(action) || action.length !== 2) {
      return null;
    }
    const [ms, choice] = action;
    if (
      !Number.isInteger(ms) ||
      ms < 0 ||
      ms > shiftMs ||
      ms - previous < QUICKEST_PRESS_MS ||
      !Number.isInteger(choice) ||
      choice < 0 ||
      choice >= rules.choices
    ) {
      return null;
    }
    previous = ms;
    presses.push([ms, choice]);
  }
  return job === 'dishes'
    ? playDishes(seed, presses, shiftMs)
    : job === 'kitchen'
      ? playKitchen(seed, presses, shiftMs)
      : playService(seed, presses, shiftMs);
}

// A simulation's result: its points, its mistakes, and when it ended.
function resultOf(
  state: { mistakes: number; endedAt: number | null } | null,
  points: number,
  shiftMs: number,
): ShiftResult | null {
  return state
    ? { score: points, mistakes: state.mistakes, endedAtMs: state.endedAt ?? shiftMs }
    : null;
}

function playDishes(seed: number, presses: ShiftAction[], shiftMs: number): ShiftResult | null {
  const state = simulateDishes(seed, presses, shiftMs);
  return resultOf(state, state ? dishesPoints(state) : 0, shiftMs);
}

function playKitchen(seed: number, presses: ShiftAction[], shiftMs: number): ShiftResult | null {
  const state = simulateKitchen(seed, presses, shiftMs);
  return resultOf(state, state ? kitchenPoints(state) : 0, shiftMs);
}

function playService(seed: number, presses: ShiftAction[], shiftMs: number): ShiftResult | null {
  const state = simulateService(seed, presses, shiftMs);
  return resultOf(state, state ? servicePoints(state) : 0, shiftMs);
}

// A shift lasts as long as its rules say, or until its last mistake: finishing earlier would mean
// the browser made it up.
export function canFinishShift(startedAt: Date, now: Date, endedAtMs: number, job: RamenJob) {
  const seconds = (now.getTime() - startedAt.getTime()) / 1000;
  return seconds >= endedAtMs / 1000 - 1 && seconds <= SHIFT_RULES[job].seconds + GRACE_SECONDS;
}
