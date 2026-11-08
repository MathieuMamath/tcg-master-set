import { isOnCounter, mailBag, PIGEONHOLES, simulateMail } from './post-mail';
import {
  BALLOON_LANES,
  balloonCalls,
  calledAt,
  highestIn,
  simulateBalloons,
  standBalloons,
} from './raffle-balloons';
import type { ShiftAction } from './shifts';

// A perfect popper, every fifth of a second: the highest balloon of a lane whenever it wears the
// colour called.
export function perfectBalloons(seed: number, until = 45_000): ShiftAction[] {
  const calls = balloonCalls(seed);
  const balloons = standBalloons(seed, calls);
  const presses: ShiftAction[] = [];
  for (let ms = 0; ms <= until; ms += 200) {
    const state = simulateBalloons(seed, presses, ms, calls, balloons);
    if (!state || state.endedAt !== null) {
      break;
    }
    const called = calledAt(calls, ms);
    const lane = Array.from({ length: BALLOON_LANES }, (_, index) => index).find((index) => {
      const highest = highestIn(state, balloons, index);
      return highest !== null && balloons[highest].color === called;
    });
    if (lane !== undefined) {
      presses.push([ms, lane]);
    }
  }
  return presses;
}

// A perfect sorter: each letter filed as soon as it is on the counter, a parcel twice.
export function perfectMail(seed: number, until = 45_000): ShiftAction[] {
  const bag = mailBag(seed);
  const presses: ShiftAction[] = [];
  let ms = 0;
  while (ms <= until) {
    const state = simulateMail(seed, presses, ms, bag);
    if (!state || state.endedAt !== null) {
      break;
    }
    if (!isOnCounter(state)) {
      ms = state.arrivedAt;
      continue;
    }
    presses.push([ms, PIGEONHOLES.indexOf(bag[state.current].to)]);
    ms += 100;
  }
  return presses;
}
