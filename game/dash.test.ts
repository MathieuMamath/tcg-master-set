import { describe, expect, test } from 'vitest';
import { DASH_SPEED_FACTOR, NO_DASH, tickDash } from './dash';

const FRAME = 1 / 60;

function run(frames: number, from = NO_DASH) {
  let dash = from;
  for (let frame = 0; frame < frames; frame++) {
    dash = tickDash(dash, false, FRAME);
  }
  return dash;
}

describe('tickDash', () => {
  test('nothing happens until it is requested', () => {
    expect(tickDash(NO_DASH, false, FRAME)).toEqual(NO_DASH);
  });

  test('a request starts a dash', () => {
    expect(tickDash(NO_DASH, true, FRAME).remaining).toBeGreaterThan(0);
  });

  test('a dash ends by itself', () => {
    expect(run(30, tickDash(NO_DASH, true, FRAME)).remaining).toBe(0);
  });

  test('a request right after a dash starts another one', () => {
    const justEnded = run(16, tickDash(NO_DASH, true, FRAME));

    expect(justEnded.remaining).toBe(0);
    expect(tickDash(justEnded, true, FRAME).remaining).toBeGreaterThan(0);
  });

  test('a request during a dash starts it over', () => {
    const started = tickDash(NO_DASH, true, FRAME);
    const halfway = run(5, started);

    expect(tickDash(halfway, true, FRAME).remaining).toBe(started.remaining);
  });

  test('moves faster than walking', () => {
    expect(DASH_SPEED_FACTOR).toBeGreaterThan(1);
  });
});
