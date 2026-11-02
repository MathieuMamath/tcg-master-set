import type { Direction } from './movement';

const DASH_SECONDS = 0.25;
const MIN_INPUT = 0.1;

// How much time is left of the dash.
export type DashState = { remaining: number };

export const NO_DASH: DashState = { remaining: 0 };

export const DASH_SPEED_FACTOR = 4;

// Every request starts a full dash at once, so that the player can spam them.
export function tickDash(dash: DashState, isRequested: boolean, delta: number): DashState {
  return { remaining: isRequested ? DASH_SECONDS : Math.max(dash.remaining - delta, 0) };
}

// Where the character is pushed, at full speed, or straight ahead when nothing pushes it.
export function dashDirection(pushed: Direction, heading: number): Direction {
  const length = Math.hypot(pushed.x, pushed.z);
  return length < MIN_INPUT
    ? { x: Math.sin(heading), z: Math.cos(heading) }
    : { x: pushed.x / length, z: pushed.z / length };
}
