export type Direction = { x: number; z: number };

export const STILL: Direction = { x: 0, z: 0 };

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

function clampLength(direction: Direction): Direction {
  const length = Math.hypot(direction.x, direction.z);
  return length > 1 ? { x: direction.x / length, z: direction.z / length } : direction;
}
