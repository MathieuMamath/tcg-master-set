export type Position = { x: number; z: number };

export type Rect = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

// Each axis is resolved on its own, so walking diagonally into an obstacle slides along it.
export function moveWithCollisions(
  from: Position,
  to: Position,
  obstacles: readonly Rect[],
  bounds: Rect,
  radius: number,
): Position {
  const x = clamp(to.x, bounds.minX + radius, bounds.maxX - radius);
  const afterX = isBlocked({ x, z: from.z }, obstacles, radius) ? from.x : x;

  const z = clamp(to.z, bounds.minZ + radius, bounds.maxZ - radius);
  const afterZ = isBlocked({ x: afterX, z }, obstacles, radius) ? from.z : z;

  return { x: afterX, z: afterZ };
}

export function isBlocked(position: Position, obstacles: readonly Rect[], radius: number): boolean {
  return obstacles.some(
    (obstacle) =>
      position.x > obstacle.minX - radius &&
      position.x < obstacle.maxX + radius &&
      position.z > obstacle.minZ - radius &&
      position.z < obstacle.maxZ + radius,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
