import { describe, expect, test } from 'vitest';
import {
  BISCUIT_BOX,
  BISCUIT_RADIUS,
  type Carving,
  canFinishDalgona,
  carveUntil,
  DALGONA_SHAPES,
  type DalgonaShape,
  FRESH_CARVING,
  fragilityAt,
  GAME_SECONDS,
  outlineLength,
  outlineOf,
  type Press,
  parsePresses,
  pointAlong,
  replayDalgona,
  shapeOf,
} from './dalgona';

// A careful player: presses while the pressure stays low, and lets go before it gets too high.
function carefulPresses(shape: DalgonaShape): Press[] {
  const presses: Press[] = [];
  let carving: Carving = FRESH_CARVING;
  let pressStart: number | null = null;
  for (let ms = 0; ms < GAME_SECONDS * 1000 && carving.status === 'carving'; ms += 50) {
    if (pressStart === null && carving.pressure <= 0.3) {
      pressStart = ms;
    } else if (pressStart !== null && carving.pressure >= 0.8) {
      presses.push([pressStart, ms]);
      pressStart = null;
    }
    const live: Press[] = pressStart === null ? presses : [...presses, [pressStart, Infinity]];
    carving = carveUntil(shape, carving, live, ms + 50);
  }
  if (pressStart !== null) {
    presses.push([pressStart, carving.ms]);
  }
  return presses;
}

describe.each(DALGONA_SHAPES)('the %s', (shape) => {
  test('fits inside the biscuit', () => {
    for (const [x, y] of outlineOf(shape)) {
      expect(Math.hypot(x - BISCUIT_BOX / 2, y - BISCUIT_BOX / 2)).toBeLessThan(BISCUIT_RADIUS);
    }
  });

  test('comes out whole for a careful player, in time', () => {
    const carving = replayDalgona(shape, carefulPresses(shape));

    expect(carving.status).toBe('carved');
    expect(carving.ms).toBeLessThan(GAME_SECONDS * 1000);
  });

  test('breaks under one long press', () => {
    expect(replayDalgona(shape, [[0, GAME_SECONDS * 1000]]).status).toBe('broken');
  });

  test('is more fragile in its corners than along its sides', () => {
    const fragilities = Array.from({ length: 400 }, (_, step) =>
      fragilityAt(shape, (step * outlineLength(shape)) / 400),
    );

    expect(Math.min(...fragilities)).toBe(1);
    expect(Math.max(...fragilities)).toBeGreaterThan(3);
  });
});

test('the harder shapes take longer to carve', () => {
  const [triangle, star, umbrella] = DALGONA_SHAPES.map(
    (shape) => replayDalgona(shape, carefulPresses(shape)).ms,
  );

  expect(triangle).toBeLessThan(star);
  expect(star).toBeLessThan(umbrella);
});

test('the needle starts and ends at the same point, going round the whole outline', () => {
  const length = outlineLength('triangle');

  expect(pointAlong('triangle', 0)).toEqual(outlineOf('triangle')[0]);
  expect(pointAlong('triangle', length)[0]).toBeCloseTo(outlineOf('triangle')[0][0]);
  expect(pointAlong('triangle', length)[1]).toBeCloseTo(outlineOf('triangle')[0][1]);
});

test('letting go eases the pressure', () => {
  const pressed = carveUntil('triangle', FRESH_CARVING, [[0, 1000]], 1000);
  const rested = carveUntil('triangle', pressed, [[0, 1000]], 1500);

  expect(pressed.pressure).toBeGreaterThan(0);
  expect(rested.pressure).toBeLessThan(pressed.pressure);
  expect(rested.distance).toBe(pressed.distance);
});

test('carving step by step ends where a single replay does', () => {
  const presses = carefulPresses('star');
  let carving: Carving = FRESH_CARVING;
  for (let ms = 0; ms <= GAME_SECONDS * 1000; ms += 17) {
    carving = carveUntil('star', carving, presses, ms);
  }

  expect(carving).toEqual(carveUntil('star', FRESH_CARVING, presses, GAME_SECONDS * 1000));
});

test('a game that runs out of time is lost', () => {
  expect(replayDalgona('umbrella', [[0, 500]]).status).toBe('broken');
});

describe('the presses sent by the browser', () => {
  test('are read when they follow one another within the game', () => {
    expect(
      parsePresses([
        [0, 400],
        [900, 1500],
      ]),
    ).toEqual([
      [0, 400],
      [900, 1500],
    ]);
    expect(parsePresses([])).toEqual([]);
  });

  test.each([
    ['no list', 'presses'],
    ['a press that is not a pair', [[0, 400, 800]]],
    ['a press that ends before it starts', [[400, 0]]],
    [
      'presses that overlap',
      [
        [0, 400],
        [300, 800],
      ],
    ],
    ['a press after the end of the game', [[0, GAME_SECONDS * 1000 + 1]]],
    ['a press that is not a number', [[0, 'soon']]],
    ['too many presses', Array.from({ length: 1001 }, (_, index) => [index * 2, index * 2 + 1])],
  ])('are refused with %s', (_, value) => {
    expect(parsePresses(value)).toBeNull();
  });
});

describe('finishing a game', () => {
  const startedAt = new Date('2026-11-04T10:00:00Z');

  test('is allowed once the presses have had time to happen', () => {
    expect(canFinishDalgona(startedAt, new Date('2026-11-04T10:00:15Z'), 14_000)).toBe(true);
  });

  test('is refused sooner than the presses took', () => {
    expect(canFinishDalgona(startedAt, new Date('2026-11-04T10:00:05Z'), 14_000)).toBe(false);
  });

  test('is refused long after the game should have ended', () => {
    expect(canFinishDalgona(startedAt, new Date('2026-11-04T10:02:00Z'), 14_000)).toBe(false);
  });
});

test('Gaspard picks every shape, and always the same one for the same start', () => {
  const shapes = new Set(
    Array.from({ length: 60 }, (_, index) => shapeOf(new Date(1_790_000_000_000 + index))),
  );

  expect(shapes).toEqual(new Set(DALGONA_SHAPES));
  expect(shapeOf(new Date(1_790_000_000_123))).toBe(shapeOf(new Date(1_790_000_000_123)));
});
