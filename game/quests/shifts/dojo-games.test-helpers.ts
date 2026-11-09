import { arrowSetups, readyAt, simulateArchery, sweepX, sweepY, windCarries } from './dojo-archery';
import { canCut, flightOf, inAir, simulateSlicing, slicingThrows, strokeOf } from './dojo-slicing';
import type { ShiftAction } from './shifts';

// A perfect slicer, every fifth of a second: every lane with a vegetable at the top of its flight
// and no pot, in one stroke.
export function perfectSlicing(seed: number, until = 45_000): ShiftAction[] {
  const throws = slicingThrows(seed);
  const presses: ShiftAction[] = [];
  for (let ms = 0; ms <= until; ms += 100) {
    const state = simulateSlicing(seed, presses, ms, throws);
    if (!state || state.endedAt !== null) {
      break;
    }
    const flying = inAir(state, throws);
    const pots = new Set(
      flying.filter((index) => throws[index].kind === 'pot').map((index) => throws[index].lane),
    );
    const targets = flying.filter((index) => {
      const thrown = throws[index];
      const share = flightOf(thrown, ms) ?? 0;
      return thrown.kind !== 'pot' && !pots.has(thrown.lane) && (share >= 0.45 || share > 0.85);
    });
    const stroke = strokeOf(state, throws, targets);
    if (stroke > 0 && canCut(state, throws, stroke)) {
      presses.push([ms, stroke]);
    }
  }
  return presses;
}

// A perfect archer: the first line held where the wind will bring the arrow back to the centre,
// the second held on the centre.
export function perfectArchery(seed: number): ShiftAction[] {
  const setups = arrowSetups(seed);
  const presses: ShiftAction[] = [];
  let ms = 0;
  for (const setup of setups) {
    const state = simulateArchery(seed, presses, ms, setups);
    const ready = state && readyAt(state);
    if (ready === null || ready === undefined) {
      break;
    }
    const after = (from: number, isRight: (at: number) => boolean) =>
      Array.from({ length: 6000 }, (_, step) => from + step).find(isRight) ?? from;
    const holdX = after(
      Math.max(ms, ready) + 100,
      (at) => Math.abs(windCarries(setup, sweepX(setup, ready, at))) < 0.02,
    );
    const loose = after(holdX + 100, (at) => Math.abs(sweepY(setup, holdX, at)) < 0.02);
    presses.push([holdX, 0], [loose, 0]);
    ms = loose;
  }
  return presses;
}
