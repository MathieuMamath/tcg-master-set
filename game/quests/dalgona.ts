// Gaspard's dalgona: carve a shape out of a thin caramel biscuit without breaking it. The needle
// follows the shape's outline while the player presses, and the pressure on the biscuit builds up
// while pressing, faster in the corners. Letting go eases it, and too much breaks the biscuit.
//
// The browser only says when each press started and ended. The server replays the presses with
// these same rules, step by step, to know whether the shape came out whole.

export const DALGONA_QUEST = 'dalgona';
export const GAME_SECONDS = 45;

export const DALGONA_SHAPES = ['triangle', 'star', 'umbrella'] as const;
export type DalgonaShape = (typeof DALGONA_SHAPES)[number];

export const SHAPE_COINS: Record<DalgonaShape, number> = {
  triangle: 100,
  star: 150,
  umbrella: 250,
};

// The biscuit is drawn in a box of this size, with its centre in the middle.
export const BISCUIT_BOX = 200;
export const BISCUIT_RADIUS = 88;

const GAME_MS = GAME_SECONDS * 1000;
// The replay moves in steps this long, the same in the browser and on the server.
export const STEP_MS = 10;
// How far along the outline the needle goes in a second of pressing, in the box's units.
const CARVE_SPEED = 36;
// The pressure a second of pressing adds on a plain stretch, out of the 1 that breaks the biscuit.
const PRESSURE_RISE = 0.4;
// The pressure a second of letting go takes away.
const PRESSURE_EASE = 0.8;
// How much harder a corner presses, for a full turn back on itself, and how far it reaches.
const CORNER_STRENGTH = 5;
const CORNER_REACH = 10;
// Room for the request to travel, or for a hidden tab's slow timers.
const GRACE_SECONDS = 15;
// More presses than anyone can make in the time.
const PRESS_LIMIT = 1000;

type Point = readonly [number, number];

function arc(
  center: Point,
  radius: number,
  fromDegrees: number,
  toDegrees: number,
  steps: number,
): Point[] {
  return Array.from({ length: steps + 1 }, (_, step) => {
    const angle = ((fromDegrees + ((toDegrees - fromDegrees) * step) / steps) * Math.PI) / 180;
    return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius] as const;
  });
}

function polygon(radii: readonly number[], firstDegrees: number): Point[] {
  return radii.map((radius, index) => {
    const angle = ((firstDegrees + (360 * index) / radii.length) * Math.PI) / 180;
    return [100 + Math.cos(angle) * radius, 100 + Math.sin(angle) * radius] as const;
  });
}

// The same closed line, starting halfway along its first side, so that the needle never starts
// in a corner.
function fromMidside(points: readonly Point[]): Point[] {
  const [first, second] = points;
  const middle: Point = [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2];
  return [middle, ...points.slice(1), first];
}

// Each shape's outline, as the corners of a closed line. Curves are cut into short straight bits,
// so that only real corners turn sharply. The needle starts on a plain stretch.
const UMBRELLA_TOP = 92;
const OUTLINES: Record<DalgonaShape, Point[]> = {
  triangle: fromMidside(polygon([62, 62, 62], -90)),
  star: fromMidside(polygon([66, 28, 66, 28, 66, 28, 66, 28, 66, 28], -90)),
  // From the top of the canopy, round to the right.
  umbrella: [
    ...arc([100, UMBRELLA_TOP], 62, 270, 360, 12),
    // Its scalloped edge, back towards the handle.
    ...arc([141, UMBRELLA_TOP], 21, 0, 180, 8).slice(1),
    ...arc([111.5, UMBRELLA_TOP], 8.5, 0, 180, 5).slice(1),
    // The handle, down, round its hook and back up.
    [103, 140],
    ...arc([92, 140], 11, 0, 180, 8).slice(1),
    ...arc([92, 140], 5, 180, 0, 6).slice(1),
    [97, UMBRELLA_TOP],
    ...arc([88.5, UMBRELLA_TOP], 8.5, 0, 180, 5).slice(1),
    ...arc([59, UMBRELLA_TOP], 21, 0, 180, 8).slice(1),
    // The canopy's left half, up to the top.
    ...arc([100, UMBRELLA_TOP], 62, 180, 270, 12).slice(1, -1),
  ],
};

export function outlineOf(shape: DalgonaShape): readonly Point[] {
  return OUTLINES[shape];
}

type Path = {
  points: readonly Point[];
  // How far along the outline each point is, ending with the whole length back to the start.
  distances: readonly number[];
  length: number;
  // The corners' places along the outline, and how sharply each turns, from 0 to 1.
  corners: readonly { at: number; sharpness: number }[];
};

function pathOf(shape: DalgonaShape): Path {
  const points = OUTLINES[shape];
  const distances = [0];
  for (let index = 1; index <= points.length; index++) {
    const [fromX, fromY] = points[index - 1];
    const [toX, toY] = points[index % points.length];
    distances.push(distances[index - 1] + Math.hypot(toX - fromX, toY - fromY));
  }
  const corners = points.flatMap((point, index) => {
    const before = points[(index - 1 + points.length) % points.length];
    const after = points[(index + 1) % points.length];
    const inAngle = Math.atan2(point[1] - before[1], point[0] - before[0]);
    const outAngle = Math.atan2(after[1] - point[1], after[0] - point[0]);
    const turn = Math.abs(Math.atan2(Math.sin(outAngle - inAngle), Math.cos(outAngle - inAngle)));
    // A curve's small bends don't count as corners.
    return turn > Math.PI / 6 ? [{ at: distances[index], sharpness: turn / Math.PI }] : [];
  });
  return { points, distances, length: distances[points.length], corners };
}

const PATHS = Object.fromEntries(DALGONA_SHAPES.map((shape) => [shape, pathOf(shape)])) as Record<
  DalgonaShape,
  Path
>;

// How hard the biscuit takes the needle at a point of the outline: 1 on a plain stretch, more
// near a corner, and most right in it.
export function fragilityAt(shape: DalgonaShape, distance: number): number {
  const { corners, length } = PATHS[shape];
  let fragility = 1;
  for (const { at, sharpness } of corners) {
    const gap = Math.abs(distance - at);
    // The outline is closed, so the last corner is also just before the start.
    const nearest = Math.min(gap, length - gap);
    fragility += Math.max(0, 1 - nearest / CORNER_REACH) * sharpness * CORNER_STRENGTH;
  }
  return fragility;
}

// Where the needle is, as a point of the outline, from how far it has gone along it.
export function pointAlong(shape: DalgonaShape, distance: number): Point {
  const { points, distances, length } = PATHS[shape];
  const along = Math.min(Math.max(distance, 0), length);
  let index = 1;
  while (index < distances.length - 1 && distances[index] < along) {
    index++;
  }
  const from = points[index - 1];
  const to = points[index % points.length];
  const span = distances[index] - distances[index - 1];
  const share = span === 0 ? 0 : (along - distances[index - 1]) / span;
  return [from[0] + (to[0] - from[0]) * share, from[1] + (to[1] - from[1]) * share];
}

export function outlineLength(shape: DalgonaShape): number {
  return PATHS[shape].length;
}

// A press, from when it started to when it ended, in milliseconds since the game began. A press
// still going on has no end yet.
export type Press = readonly [start: number, end: number];

export type CarvingStatus = 'carving' | 'carved' | 'broken';

export type Carving = {
  status: CarvingStatus;
  ms: number;
  // How far along the outline the needle has gone, in the box's units.
  distance: number;
  // From 0 to 1, where the biscuit breaks.
  pressure: number;
  // The press the replay has reached, so that the next steps start looking from there.
  pressIndex: number;
};

export const FRESH_CARVING: Carving = {
  status: 'carving',
  ms: 0,
  distance: 0,
  pressure: 0,
  pressIndex: 0,
};

// Plays the presses forward, one step at a time, until this moment or until the shape is carved
// or broken. The browser calls it at every frame, and the server once with the whole game.
export function carveUntil(
  shape: DalgonaShape,
  carving: Carving,
  presses: readonly Press[],
  untilMs: number,
): Carving {
  const { length } = PATHS[shape];
  let { status, ms, distance, pressure, pressIndex } = carving;
  const seconds = STEP_MS / 1000;
  while (status === 'carving' && ms + STEP_MS <= Math.min(untilMs, GAME_MS)) {
    while (pressIndex < presses.length && presses[pressIndex][1] <= ms) {
      pressIndex++;
    }
    const press = presses[pressIndex];
    const isPressing = press !== undefined && press[0] <= ms && ms < press[1];
    if (isPressing) {
      pressure += PRESSURE_RISE * fragilityAt(shape, distance) * seconds;
      distance += CARVE_SPEED * seconds;
    } else {
      pressure = Math.max(0, pressure - PRESSURE_EASE * seconds);
    }
    ms += STEP_MS;
    if (pressure >= 1) {
      status = 'broken';
    } else if (distance >= length) {
      distance = length;
      status = 'carved';
    }
  }
  return { status, ms, distance, pressure: Math.min(pressure, 1), pressIndex };
}

// The presses as the browser sent them, or null if they can't have happened: they must follow one
// another, each within the game's time. The request comes from the browser, so it can be anything.
export function parsePresses(value: unknown): Press[] | null {
  if (!Array.isArray(value) || value.length > PRESS_LIMIT) {
    return null;
  }
  const presses: Press[] = [];
  let previousEnd = 0;
  for (const press of value) {
    if (!Array.isArray(press) || press.length !== 2) {
      return null;
    }
    const [start, end] = press;
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start < previousEnd ||
      end <= start ||
      end > GAME_MS
    ) {
      return null;
    }
    presses.push([start, end]);
    previousEnd = end;
  }
  return presses;
}

// The whole game replayed. A game that runs out of time without breaking the biscuit is lost too.
export function replayDalgona(shape: DalgonaShape, presses: readonly Press[]): Carving {
  const carving = carveUntil(shape, FRESH_CARVING, presses, GAME_MS);
  return carving.status === 'carving' ? { ...carving, status: 'broken' } : carving;
}

// The game can't have ended before the time its presses took, which would mean the browser made
// them up, nor long after it should have.
export function canFinishDalgona(startedAt: Date, now: Date, endedAtMs: number): boolean {
  const seconds = (now.getTime() - startedAt.getTime()) / 1000;
  return seconds >= endedAtMs / 1000 - 1 && seconds <= GAME_SECONDS + GRACE_SECONDS;
}

// Gaspard picks the shape himself, from the moment the game starts, so that the server can find it
// again without storing it. Mixing the milliseconds keeps it from simply following the clock.
export function shapeOf(startedAt: Date): DalgonaShape {
  let mixed = Math.floor(startedAt.getTime()) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x45d9f3b);
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x45d9f3b);
  mixed = (mixed ^ (mixed >>> 16)) >>> 0;
  return DALGONA_SHAPES[mixed % DALGONA_SHAPES.length];
}
