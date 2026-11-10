// The third star of every shift is meant to be hard, but not to ask for a perfect game. These
// players are not perfect: they read the screen at a human pace and miss their timings a little,
// and the test checks that they still reach three stars in a fair share of games.
import { describe, expect, test } from 'vitest';
import { seededRandom } from '../../seeded-random';
import { perfectPhotos } from './city-photos.test-helpers';
import { arrowSetups, readyAt, simulateArchery, sweepX, sweepY, windCarries } from './dojo-archery';
import { canCut, flightOf, inAir, simulateSlicing, slicingThrows, strokeOf } from './dojo-slicing';
import { BINS, inReach, parkLitter, simulateCleanup } from './park-cleanup';
import {
  angleAt,
  BEST_STRENGTH,
  bestAngle,
  pebbleReadyAt,
  pebbleSetups,
  simulateStones,
  strengthAt,
} from './park-stones';
import { mailBag, PIGEONHOLES, simulateMail } from './post-mail';
import {
  BALLOON_LANES,
  balloonCalls,
  calledAt,
  highestIn,
  simulateBalloons,
  standBalloons,
} from './raffle-balloons';
import { canDo, dirtyBowls, simulateDishes } from './ramen-dishes';
import { isBowlInZone, KITCHEN_INGREDIENTS, kitchenOrders, simulateKitchen } from './ramen-kitchen';
import { dishInHand, serviceGuests, simulateService } from './ramen-service';
import {
  playShift,
  QUICKEST_PRESS_MS,
  SHIFT_RULES,
  type ShiftAction,
  type ShiftJob,
  shiftStars,
} from './shifts';

type Skill = { name: string; step: number; react: number; sd: number };
// A good player: a decision every 0.6 seconds on what the shift shows, a stamp read in 0.7, and a
// timing missed by 40 milliseconds on average.
const GOOD: Skill = { name: 'good', step: 600, react: 700, sd: 40 };

function normal(random: () => number, sd: number) {
  const u = Math.max(1e-9, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random()) * sd;
}

function jitter(presses: ShiftAction[], random: () => number, sd: number): ShiftAction[] {
  let previous = -Infinity;
  return presses.map(([ms, choice]) => {
    const at = Math.max(0, Math.round(ms + normal(random, sd)), previous + QUICKEST_PRESS_MS);
    previous = at;
    return [at, choice];
  });
}

const after = (from: number, isRight: (at: number) => boolean) =>
  Array.from({ length: 6000 }, (_, step) => from + step).find(isRight) ?? from;

type Human = (seed: number, skill: Skill, random: () => number, option?: number) => ShiftAction[];

const HUMANS: Record<ShiftJob, Human> = {
  dishes: (seed, skill, _random, height = 5) => {
    const bowls = dirtyBowls(seed);
    const presses: ShiftAction[] = [];
    for (let ms = 0; ms <= 45_000; ms += skill.step) {
      const state = simulateDishes(seed, presses, ms, bowls);
      if (!state || state.endedAt !== null) break;
      if (state.pile >= height && canDo(state, 'deliver')) presses.push([ms, 3]);
      else if (canDo(state, 'scrub'))
        presses.push([ms, state.stainsLeft > 0 ? 0 : state.isRinsed ? 2 : 1]);
    }
    return presses;
  },
  kitchen: (seed, skill) => {
    const orders = kitchenOrders(seed);
    const presses: ShiftAction[] = [];
    for (let ms = 0; ms <= 45_000; ms += skill.step) {
      const state = simulateKitchen(seed, presses, ms, orders);
      if (!state || state.endedAt !== null || !isBowlInZone(state)) continue;
      const missing = orders[state.order].ingredients.find((item) => !state.added.includes(item));
      if (missing) presses.push([ms, KITCHEN_INGREDIENTS.indexOf(missing)]);
    }
    return presses;
  },
  service: (seed, skill) => {
    const guests = serviceGuests(seed);
    const presses: ShiftAction[] = [];
    for (let ms = 0; ms <= 60_000; ms += skill.step) {
      const state = simulateService(seed, presses, ms, guests);
      if (!state) continue;
      const dirty = state.tables.findIndex((seat) => seat?.outcome === 'dirty');
      if (dirty >= 0) {
        presses.push([ms, dirty]);
        continue;
      }
      const hand = dishInHand(state);
      const tables = state.tables
        .map((seat, table) => ({ seat, table }))
        .filter(
          ({ seat }) =>
            hand && seat?.outcome === 'waiting' && guests[seat.guest].dish === hand.dish,
        )
        .sort((a, b) => (a.seat?.seatedAt ?? 0) - (b.seat?.seatedAt ?? 0));
      if (tables[0]) presses.push([ms, tables[0].table]);
    }
    return presses;
  },
  slicing: (seed, skill) => {
    const throws = slicingThrows(seed);
    const presses: ShiftAction[] = [];
    for (let ms = 0; ms <= 45_000; ms += Math.round(skill.step / 2)) {
      const state = simulateSlicing(seed, presses, ms, throws);
      if (!state || state.endedAt !== null) break;
      const flying = inAir(state, throws);
      const pots = new Set(
        flying.filter((i) => throws[i].kind === 'pot').map((i) => throws[i].lane),
      );
      const targets = flying.filter((i) => {
        const share = flightOf(throws[i], ms) ?? 0;
        return throws[i].kind !== 'pot' && !pots.has(throws[i].lane) && share >= 0.45;
      });
      const stroke = strokeOf(state, throws, targets);
      if (stroke > 0 && canCut(state, throws, stroke)) presses.push([ms, stroke]);
    }
    return presses;
  },
  archery: (seed, skill, random) => {
    const setups = arrowSetups(seed);
    const presses: ShiftAction[] = [];
    let ms = 0;
    for (const setup of setups) {
      const state = simulateArchery(seed, presses, ms, setups);
      const ready = state && readyAt(state);
      if (ready === null || ready === undefined) break;
      const holdX =
        after(
          Math.max(ms, ready) + 300,
          (at) => Math.abs(windCarries(setup, sweepX(setup, ready, at))) < 0.02,
        ) + Math.round(normal(random, skill.sd));
      const loose =
        after(holdX + 300, (at) => Math.abs(sweepY(setup, holdX, at)) < 0.02) +
        Math.round(normal(random, skill.sd));
      const at = Math.max(loose, holdX + QUICKEST_PRESS_MS);
      presses.push([holdX, 0], [at, 0]);
      ms = at;
    }
    return presses;
  },
  cleanup: (seed, skill, random) => {
    const litter = parkLitter(seed);
    const presses: ShiftAction[] = [];
    let previous = -Infinity;
    litter.forEach(({ at, bin }, index) => {
      const ms = Math.round(at - 150 + normal(random, skill.sd * 2.5));
      if (ms > 45_000 || ms < previous + QUICKEST_PRESS_MS) return;
      const state = simulateCleanup(seed, presses, ms, litter);
      if (!state || state.endedAt !== null || inReach(state, litter) !== index) return;
      presses.push([ms, BINS.indexOf(bin)]);
      previous = ms;
    });
    return presses;
  },
  stones: (seed, skill, random) => {
    const setups = pebbleSetups(seed);
    const presses: ShiftAction[] = [];
    let ms = 0;
    for (const setup of setups) {
      const state = simulateStones(seed, presses, ms, setups);
      const ready = state && pebbleReadyAt(state);
      if (ready === null || ready === undefined) break;
      const hold =
        after(
          Math.max(ms, ready) + 300,
          (at) => Math.abs(angleAt(setup, ready, at) - bestAngle(setup)) < 0.005,
        ) + Math.round(normal(random, skill.sd));
      const thrown =
        after(hold + 300, (at) => Math.abs(strengthAt(setup, hold, at) - BEST_STRENGTH) < 0.005) +
        Math.round(normal(random, skill.sd));
      const at = Math.max(thrown, hold + QUICKEST_PRESS_MS);
      presses.push([hold, 0], [at, 0]);
      ms = at;
    }
    return presses;
  },
  balloons: (seed, skill) => {
    const calls = balloonCalls(seed);
    const balloons = standBalloons(seed, calls);
    const presses: ShiftAction[] = [];
    for (let ms = 0; ms <= 45_000; ms += skill.step) {
      const state = simulateBalloons(seed, presses, ms, calls, balloons);
      if (!state || state.endedAt !== null) break;
      const called = calledAt(calls, ms);
      const lane = Array.from({ length: BALLOON_LANES }, (_, i) => i).find((i) => {
        const highest = highestIn(state, balloons, i);
        return highest !== null && balloons[highest].color === called;
      });
      if (lane !== undefined) presses.push([ms, lane]);
    }
    return presses;
  },
  // Each letter filed a reaction's time after it lands, a parcel's second press a moment later.
  mail: (seed, skill, random) => {
    const bag = mailBag(seed);
    const presses: ShiftAction[] = [];
    let ms = 0;
    let seen = -1;
    while (ms <= 45_000) {
      const state = simulateMail(seed, presses, ms, bag);
      if (!state || state.endedAt !== null) break;
      if (state.current !== seen) {
        // A new letter: read its stamp once it lands.
        seen = state.current;
        ms =
          state.arrivedAt + Math.max(300, Math.round(skill.react + normal(random, skill.sd * 2)));
        continue;
      }
      presses.push([ms, PIGEONHOLES.indexOf(bag[state.current].to)]);
      ms += Math.max(QUICKEST_PRESS_MS, Math.round(skill.react / 2 + normal(random, skill.sd)));
    }
    return presses.filter(([at]) => at <= 45_000);
  },
  photos: (seed, skill, random) => jitter(perfectPhotos(seed), random, skill.sd),
};

const SEEDS = Array.from({ length: 30 }, (_, index) => 1000 + index * 7919);

// The share of games in which a good player reaches three stars, at least. The dishes ask for
// quick, thoughtless presses rather than decisions, so their good player presses every half-second.
const AT_LEAST = 0.3;

describe('a good player, without a perfect game', () => {
  test.each(Object.keys(SHIFT_RULES) as ShiftJob[])('reaches three stars at %s', (job) => {
    const skill = job === 'dishes' ? { ...GOOD, step: 500 } : GOOD;
    const threeStars = SEEDS.filter((seed) => {
      const presses = HUMANS[job](seed, skill, seededRandom(seed ^ 0xabc));
      const result = playShift(job, seed, presses);
      expect(result).not.toBeNull();
      return shiftStars(job, result?.score ?? 0) === 3;
    });
    expect(threeStars.length / SEEDS.length).toBeGreaterThanOrEqual(AT_LEAST);
  });
});
