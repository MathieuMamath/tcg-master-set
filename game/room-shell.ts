import type { Rect } from './collision';
import type { Arrival, Exit, ExitMarker, PlaceId, PlaceItem } from './world';

const TILE_SIZE = 1.5;

export const ROOM_FLOOR_HEIGHT = 0.05 * 1.5;

function tileCenters(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index - (count - 1) / 2) * TILE_SIZE);
}

type RoomColors = { floor?: string; wall?: string };

// A room with its door in the last tile of the left wall.
export function buildRoom(columns: number, rows: number, colors: RoomColors = {}) {
  const halfWidth = (columns * TILE_SIZE) / 2;
  const halfDepth = (rows * TILE_SIZE) / 2;
  const bounds: Rect = { minX: -halfWidth, maxX: halfWidth, minZ: -halfDepth, maxZ: halfDepth };
  const columnCenters = tileCenters(columns);
  const rowCenters = tileCenters(rows);
  const doorZ = rowCenters[rowCenters.length - 1];
  const backWallZ = bounds.minZ - 0.04;
  const leftWallX = bounds.minX - 0.04;

  const floor: PlaceItem[] = columnCenters.flatMap((x) =>
    rowCenters.map((z) => ({
      model: 'furniture/floorFull' as const,
      x,
      z,
      height: 0,
      color: colors.floor,
    })),
  );

  // The two walls away from the camera, so that nothing hides the character.
  const walls: PlaceItem[] = [
    ...columnCenters.map((x) => ({
      model: 'furniture/wall' as const,
      x,
      z: backWallZ,
      height: 0,
      color: colors.wall,
    })),
    ...rowCenters.map((z, row) => ({
      model:
        z === doorZ
          ? ('furniture/wallDoorway' as const)
          : row % 2 === 1
            ? ('furniture/wallWindow' as const)
            : ('furniture/wall' as const),
      x: leftWallX,
      z,
      height: 0,
      quarterTurns: 1,
      color: colors.wall,
    })),
  ];

  const arrival: Arrival = { x: bounds.minX + 0.95, z: doorZ, heading: Math.PI / 2 };
  const doorMarker: ExitMarker = { x: bounds.minX + 0.23, z: doorZ, quarterTurns: 1 };

  const doorExit = (to: PlaceId, arrivalThere: Arrival): Exit => ({
    // The character can get within its own radius of the wall, so this is always reachable.
    area: {
      minX: bounds.minX,
      maxX: bounds.minX + 0.35,
      minZ: doorZ - 0.5,
      maxZ: doorZ + 0.5,
    },
    to,
    arrival: arrivalThere,
  });

  return { items: [...floor, ...walls], bounds, arrival, doorMarker, doorExit };
}
