import { ARCHERY_ACTIONS, archeryPoints, simulateArchery } from './dojo-archery';
import { SLICING_STROKES, simulateSlicing, slicingPoints } from './dojo-slicing';
import { BINS, cleanupPoints, simulateCleanup } from './park-cleanup';
import { STONE_ACTIONS, simulateStones, stonesPoints } from './park-stones';
import { DISH_ACTIONS, dishesPoints, simulateDishes } from './ramen-dishes';
import { KITCHEN_INGREDIENTS, kitchenPoints, simulateKitchen } from './ramen-kitchen';
import { SERVICE_TABLES, servicePoints, simulateService } from './ramen-service';

// The shifts: short games played for someone in the big city, each its own daily quest. Yuzu hires
// the player at the ramen shop to wash the bowls, help in the kitchen and wait on the tables, and
// Maître Kaito trains them at the dojo in slicing and archery. At Linden Park, Pépin the gardener
// has the path cleaned up, and Papy Caillou skips stones on the lake. A shift's orders come from a seed,
// the moment it began, so that the server can find them again. The browser only sends what was
// pressed and when, and the server plays the shift again with the same rules to get the score. A
// shift pays once a day, the first time it earns something, in coins.

export const RAMEN_JOBS = ['dishes', 'kitchen', 'service'] as const;
export const DOJO_JOBS = ['slicing', 'archery'] as const;
export const GARDEN_JOBS = ['cleanup'] as const;
export const STONES_JOBS = ['stones'] as const;
export const SHIFT_JOBS = [...RAMEN_JOBS, ...DOJO_JOBS, ...GARDEN_JOBS, ...STONES_JOBS] as const;
export type RamenJob = (typeof RAMEN_JOBS)[number];
export type DojoJob = (typeof DOJO_JOBS)[number];
export type ShiftJob = (typeof SHIFT_JOBS)[number];

// The quest ids, which players' progress is stored under.
export const SHIFT_QUESTS = {
  dishes: 'ramen-dishes',
  kitchen: 'ramen-kitchen',
  service: 'ramen-service',
  slicing: 'dojo-slicing',
  archery: 'dojo-archery',
  cleanup: 'park-cleanup',
  stones: 'park-stones',
} as const satisfies Record<ShiftJob, string>;

export function isShiftJob(value: unknown): value is ShiftJob {
  return SHIFT_JOBS.some((job) => job === value);
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
  // From the lowest score that pays, each step with its coins: one step a star, three in all.
  pay: readonly [ShiftPay, ShiftPay, ShiftPay];
};

export const SHIFT_RULES: Record<ShiftJob, ShiftRules> = {
  dishes: {
    seconds: 45,
    // Scrub, rinse, stack, and carry the pile to Yuzu.
    choices: DISH_ACTIONS.length,
    pay: [
      { score: 16, coins: 120 },
      { score: 28, coins: 200 },
      // A careful washer stays near 32: three stars ask for a taller, riskier pile.
      { score: 35, coins: 300 },
    ],
  },
  kitchen: {
    seconds: 45,
    // One button per bin of ingredients.
    choices: KITCHEN_INGREDIENTS.length,
    pay: [
      { score: 20, coins: 120 },
      { score: 36, coins: 200 },
      { score: 50, coins: 300 },
    ],
  },
  service: {
    seconds: 60,
    // One button per table.
    choices: SERVICE_TABLES,
    pay: [
      { score: 30, coins: 120 },
      { score: 55, coins: 200 },
      { score: 77, coins: 300 },
    ],
  },
  slicing: {
    seconds: 45,
    // Every set of lanes a stroke can cross.
    choices: SLICING_STROKES,
    pay: [
      { score: 30, coins: 120 },
      { score: 55, coins: 200 },
      { score: 77, coins: 300 },
    ],
  },
  archery: {
    seconds: 60,
    // Aiming: the first press holds the side-to-side line, the second looses the arrow.
    choices: ARCHERY_ACTIONS.length,
    pay: [
      { score: 50, coins: 120 },
      { score: 75, coins: 200 },
      { score: 105, coins: 300 },
    ],
  },
  cleanup: {
    seconds: 45,
    // The three bins.
    choices: BINS.length,
    pay: [
      { score: 12, coins: 120 },
      { score: 28, coins: 200 },
      { score: 40, coins: 300 },
    ],
  },
  stones: {
    seconds: 40,
    // Throwing: the first press holds the angle, the second throws.
    choices: STONE_ACTIONS.length,
    pay: [
      { score: 20, coins: 120 },
      { score: 35, coins: 200 },
      { score: 55, coins: 300 },
    ],
  },
};

// The stars a shift earns: one for each step of pay.
export function shiftStars(job: ShiftJob, score: number): 0 | 1 | 2 | 3 {
  const [first, second, third] = SHIFT_RULES[job].pay;
  return score >= third.score ? 3 : score >= second.score ? 2 : score >= first.score ? 1 : 0;
}

export function shiftCoins(job: ShiftJob, score: number): number {
  return SHIFT_RULES[job].pay.reduce(
    (coins, step) => (score >= step.score ? step.coins : coins),
    0,
  );
}

export type ShiftPayout = {
  // The coins this shift pays now.
  coins: number;
  // The coins paid today in all, once this shift is paid.
  paidToday: number;
  // The shift earned coins, but they were paid today already.
  wasAlreadyPaid: boolean;
  // Nothing more can be earned today from this job.
  hasEarnedAll: boolean;
};

// What a shift pays, given what the job paid already today, null if nothing yet. Shifts can be
// replayed all day for a better score: each new star pays the difference, up to the last step.
export function shiftPayout(job: ShiftJob, score: number, paidToday: number | null): ShiftPayout {
  const { pay } = SHIFT_RULES[job];
  const earned = shiftCoins(job, score);
  const already = paidToday ?? 0;
  const coins = Math.max(0, earned - already);
  const paid = already + coins;
  return {
    coins,
    paidToday: paid,
    wasAlreadyPaid: earned > 0 && coins === 0,
    hasEarnedAll: paid >= pay[pay.length - 1].coins,
  };
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
export function playShift(job: ShiftJob, seed: number, actions: unknown): ShiftResult | null {
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
  return PLAYERS[job](seed, presses, shiftMs);
}

// A simulation's result: its points, its mistakes, and when it ended.
function resultOf(
  state: { mistakes: number; endedAt: number | null } | null,
  points: number,
  shiftMs: number,
): ShiftResult | null {
  // A last throw still in the air when the time is up ends with the shift.
  return state
    ? {
        score: points,
        mistakes: state.mistakes,
        endedAtMs: Math.min(state.endedAt ?? shiftMs, shiftMs),
      }
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

function playSlicing(seed: number, presses: ShiftAction[], shiftMs: number): ShiftResult | null {
  const state = simulateSlicing(seed, presses, shiftMs);
  return resultOf(state, state ? slicingPoints(state) : 0, shiftMs);
}

function playArchery(seed: number, presses: ShiftAction[], shiftMs: number): ShiftResult | null {
  const state = simulateArchery(seed, presses, shiftMs);
  return resultOf(state, state ? archeryPoints(state) : 0, shiftMs);
}

function playCleanup(seed: number, presses: ShiftAction[], shiftMs: number): ShiftResult | null {
  const state = simulateCleanup(seed, presses, shiftMs);
  return resultOf(state, state ? cleanupPoints(state) : 0, shiftMs);
}

function playStones(seed: number, presses: ShiftAction[], shiftMs: number): ShiftResult | null {
  const state = simulateStones(seed, presses, shiftMs);
  return resultOf(state, state ? stonesPoints(state) : 0, shiftMs);
}

const PLAYERS: Record<
  ShiftJob,
  (seed: number, presses: ShiftAction[], shiftMs: number) => ShiftResult | null
> = {
  dishes: playDishes,
  kitchen: playKitchen,
  service: playService,
  slicing: playSlicing,
  archery: playArchery,
  cleanup: playCleanup,
  stones: playStones,
};

// A shift lasts as long as its rules say, or until its last mistake: finishing earlier would mean
// the browser made it up.
export function canFinishShift(startedAt: Date, now: Date, endedAtMs: number, job: ShiftJob) {
  const seconds = (now.getTime() - startedAt.getTime()) / 1000;
  return seconds >= endedAtMs / 1000 - 1 && seconds <= SHIFT_RULES[job].seconds + GRACE_SECONDS;
}
