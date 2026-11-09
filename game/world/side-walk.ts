import { DASH_SPEED_FACTOR } from './dash';
import type { Direction } from './movement';

// The world is seen from the side, so the character only walks left and right.
export const WALK_SPEED = 3.3;
const ACCELERATION = 10;
const MIN_INPUT = 0.1;
// Below this speed the character stands, and its walking bounce stops.
export const WALKING_SPEED = 0.3;

export type Facing = 1 | -1;

export type Walker = { x: number; velocity: number; facing: Facing };

// Sideways only: a push up or down does nothing.
export function sidePush(direction: Direction): number {
  return Math.abs(direction.x) < MIN_INPUT ? 0 : Math.max(-1, Math.min(1, direction.x));
}

// The speed eases towards the push, so that starting and stopping look soft. A dash goes at full
// dash speed the way the character faces, or the way it is pushed.
export function stepWalker(
  walker: Walker,
  push: number,
  isDashing: boolean,
  delta: number,
  bounds: { minX: number; maxX: number },
): Walker {
  const facing: Facing = push > 0 ? 1 : push < 0 ? -1 : walker.facing;
  const velocity = isDashing
    ? facing * WALK_SPEED * DASH_SPEED_FACTOR
    : walker.velocity + (push * WALK_SPEED - walker.velocity) * Math.min(1, delta * ACCELERATION);
  const x = Math.max(bounds.minX, Math.min(bounds.maxX, walker.x + velocity * delta));
  // Against an edge the character stops, rather than keeping a speed it can't use.
  const isBlocked = x !== walker.x + velocity * delta;
  return { x, velocity: isBlocked ? 0 : velocity, facing };
}

// The camera lags behind the character, so that the place seems to slide by, but follows closely
// enough on a long street that the character never walks off the side of the screen.
const CAMERA_LAG = 0.45;
const CAMERA_MARGIN = 1;

export function cameraX(bounds: { minX: number; maxX: number }, x: number, viewWidth: number) {
  const middle = (bounds.minX + bounds.maxX) / 2;
  const halfLength = (bounds.maxX - bounds.minX) / 2;
  const roomToLag = Math.max(0, viewWidth / 2 - CAMERA_MARGIN) / halfLength;
  return middle + (x - middle) * (1 - Math.min(CAMERA_LAG, roomToLag));
}
