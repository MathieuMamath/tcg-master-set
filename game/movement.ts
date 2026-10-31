export type Direction = { x: number; z: number };

export type CharacterState = {
  x: number;
  z: number;
  heading: number;
  isMoving: boolean;
};

export type FocusPoint = { x: number; z: number };

export const STILL: Direction = { x: 0, z: 0 };

const WALK_SPEED = 1.6;
const TURN_SPEED = 12;
const MIN_INPUT = 0.1;
const FULL_VIEW_ASPECT_RATIO = 0.9;
const MAX_CAMERA_DISTANCE_FACTOR = 1.35;
const FOLLOW_FOCUS_RADIUS = 1;

// Physical key positions: KeyW is the Z key on an AZERTY keyboard.
const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: { x: 0, z: -1 },
  KeyW: { x: 0, z: -1 },
  ArrowDown: { x: 0, z: 1 },
  KeyS: { x: 0, z: 1 },
  ArrowLeft: { x: -1, z: 0 },
  KeyA: { x: -1, z: 0 },
  ArrowRight: { x: 1, z: 0 },
  KeyD: { x: 1, z: 0 },
};

export function isMovementKey(code: string): boolean {
  return code in KEY_DIRECTIONS;
}

export function keyboardDirection(pressedKeys: Iterable<string>): Direction {
  let x = 0;
  let z = 0;
  for (const code of new Set(pressedKeys)) {
    x += KEY_DIRECTIONS[code]?.x ?? 0;
    z += KEY_DIRECTIONS[code]?.z ?? 0;
  }
  return clampLength({ x: Math.sign(x), z: Math.sign(z) });
}

export function joystickDirection(offsetX: number, offsetY: number, radius: number): Direction {
  return clampLength({ x: offsetX / radius, z: offsetY / radius });
}

export function stepCharacter(
  state: CharacterState,
  direction: Direction,
  delta: number,
): CharacterState {
  const input = clampLength(direction);

  if (Math.hypot(input.x, input.z) < MIN_INPUT) {
    return { ...state, isMoving: false };
  }

  return {
    x: state.x + input.x * WALK_SPEED * delta,
    z: state.z + input.z * WALK_SPEED * delta,
    heading: turnTowards(state.heading, Math.atan2(input.x, input.z), TURN_SPEED * delta),
    isMoving: true,
  };
}

// Turns on the spot, for when something else has the character's attention.
export function faceTowards(
  state: CharacterState,
  target: { x: number; z: number },
  delta: number,
): CharacterState {
  const heading = Math.atan2(target.x - state.x, target.z - state.z);

  return {
    ...state,
    heading: turnTowards(state.heading, heading, TURN_SPEED * delta),
    isMoving: false,
  };
}

// The camera holds still while the character stays near its focus, so walking is visible
// even with nothing else in the scene to compare against.
export function followFocus(focus: FocusPoint, character: FocusPoint, radius: number): FocusPoint {
  const offsetX = character.x - focus.x;
  const offsetZ = character.z - focus.z;
  const distance = Math.hypot(offsetX, offsetZ);

  if (distance <= radius) {
    return focus;
  }

  const excess = (distance - radius) / distance;
  return { x: focus.x + offsetX * excess, z: focus.z + offsetZ * excess };
}

// Narrow screens pull the camera back to show more of the scene, up to a limit where the
// character would become too small. Below it, the camera follows the character instead.
export function cameraDistanceFactor(aspectRatio: number): number {
  return Math.min(Math.max(FULL_VIEW_ASPECT_RATIO / aspectRatio, 1), MAX_CAMERA_DISTANCE_FACTOR);
}

// When the whole scene fits on screen, the camera has no reason to move at all.
export function cameraFocusRadius(aspectRatio: number, fitsOnWideScreens: boolean): number {
  return fitsOnWideScreens && aspectRatio >= FULL_VIEW_ASPECT_RATIO
    ? Number.POSITIVE_INFINITY
    : FOLLOW_FOCUS_RADIUS;
}

function clampLength(direction: Direction): Direction {
  const length = Math.hypot(direction.x, direction.z);
  return length > 1 ? { x: direction.x / length, z: direction.z / length } : direction;
}

function turnTowards(current: number, target: number, maxStep: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + Math.sign(difference) * Math.min(Math.abs(difference), maxStep);
}
