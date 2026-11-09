import { BINS, parkLitter } from './park-cleanup';
import {
  angleAt,
  BEST_STRENGTH,
  bestAngle,
  pebbleReadyAt,
  pebbleSetups,
  simulateStones,
  strengthAt,
} from './park-stones';
import type { ShiftAction } from './shifts';

// A perfect cleaner: each piece into its bin as it meets them.
export function perfectCleanup(seed: number, until = 45_000): ShiftAction[] {
  return parkLitter(seed)
    .filter(({ at }) => at <= until)
    .map(({ at, bin }) => [at, BINS.indexOf(bin)] as const);
}

// A perfect thrower: the angle held where the wind wants it, the strength at its best.
export function perfectStones(seed: number): ShiftAction[] {
  const setups = pebbleSetups(seed);
  const presses: ShiftAction[] = [];
  let ms = 0;
  for (const setup of setups) {
    const state = simulateStones(seed, presses, ms, setups);
    const ready = state && pebbleReadyAt(state);
    if (ready === null || ready === undefined) {
      break;
    }
    const after = (from: number, isRight: (at: number) => boolean) =>
      Array.from({ length: 6000 }, (_, step) => from + step).find(isRight) ?? from;
    const hold = after(
      Math.max(ms, ready) + 100,
      (at) => Math.abs(angleAt(setup, ready, at) - bestAngle(setup)) < 0.005,
    );
    const thrown = after(
      hold + 100,
      (at) => Math.abs(strengthAt(setup, hold, at) - BEST_STRENGTH) < 0.005,
    );
    presses.push([hold, 0], [thrown, 0]);
    ms = thrown;
  }
  return presses;
}
