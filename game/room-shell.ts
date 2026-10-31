import type { Rect } from './collision';
import type { Arrival, Exit, ExitMarker, PlaceId, PlaceItem } from './world';

const TILE_SIZE = 1.5;
const HALF_SIZE = (3 * TILE_SIZE) / 2;
const DOOR_Z = TILE_SIZE;

export const ROOM_FLOOR_HEIGHT = 0.05 * 1.5;

export const ROOM_BOUNDS: Rect = {
  minX: -HALF_SIZE,
  maxX: HALF_SIZE,
  minZ: -HALF_SIZE,
  maxZ: HALF_SIZE,
};

const BACK_WALL_Z = ROOM_BOUNDS.minZ - 0.04;
const LEFT_WALL_X = ROOM_BOUNDS.minX - 0.04;

const FLOOR: PlaceItem[] = [-1, 0, 1].flatMap((column) =>
  [-1, 0, 1].map((row) => ({
    model: 'furniture/floorFull' as const,
    x: column * TILE_SIZE,
    z: row * TILE_SIZE,
    height: 0,
  })),
);

// The two walls away from the camera, so that nothing hides the character.
const WALLS: PlaceItem[] = [
  { model: 'furniture/wall', x: -TILE_SIZE, z: BACK_WALL_Z, height: 0 },
  { model: 'furniture/wall', x: 0, z: BACK_WALL_Z, height: 0 },
  { model: 'furniture/wall', x: TILE_SIZE, z: BACK_WALL_Z, height: 0 },
  { model: 'furniture/wall', x: LEFT_WALL_X, z: -TILE_SIZE, height: 0, quarterTurns: 1 },
  { model: 'furniture/wallWindow', x: LEFT_WALL_X, z: 0, height: 0, quarterTurns: 1 },
  { model: 'furniture/wallDoorway', x: LEFT_WALL_X, z: DOOR_Z, height: 0, quarterTurns: 1 },
];

export const ROOM_SHELL: readonly PlaceItem[] = [...FLOOR, ...WALLS];

export const ARRIVAL_THROUGH_ROOM_DOOR: Arrival = { x: -1.3, z: DOOR_Z, heading: Math.PI / 2 };

export const ROOM_DOOR_MARKER: ExitMarker = { x: -2.02, z: DOOR_Z, quarterTurns: 1 };

export function roomDoorExit(to: PlaceId, arrival: Arrival): Exit {
  return {
    // The character can get within its own radius of the wall, so this is always reachable.
    area: {
      minX: ROOM_BOUNDS.minX,
      maxX: ROOM_BOUNDS.minX + 0.35,
      minZ: DOOR_Z - 0.5,
      maxZ: DOOR_Z + 0.5,
    },
    to,
    arrival,
  };
}
