import type { Rect } from './collision';
import type { Arrival, Place, PlaceItem } from './world';

const TILE_SIZE = 1.5;
const FLOOR_HEIGHT = 0.05 * 1.5;
export const DESK_TOP = FLOOR_HEIGHT + 0.384 * 1.5;

const HALF_SIZE = (3 * TILE_SIZE) / 2;
const DOOR_Z = TILE_SIZE;

const BOUNDS: Rect = { minX: -HALF_SIZE, maxX: HALF_SIZE, minZ: -HALF_SIZE, maxZ: HALF_SIZE };

const BACK_WALL_Z = BOUNDS.minZ - 0.04;
const LEFT_WALL_X = BOUNDS.minX - 0.04;

export const BEDROOM_START: Arrival = { x: 0.4, z: 0.7, heading: 0 };
export const BEDROOM_FROM_TOWN: Arrival = { x: -1.3, z: DOOR_Z, heading: Math.PI / 2 };

const FLOOR: PlaceItem[] = [-1, 0, 1].flatMap((column) =>
  [-1, 0, 1].map((row) => ({
    model: 'furniture/floorFull' as const,
    x: column * TILE_SIZE,
    z: row * TILE_SIZE,
    height: 0,
  })),
);

const WALLS: PlaceItem[] = [
  { model: 'furniture/wall', x: -TILE_SIZE, z: BACK_WALL_Z, height: 0 },
  { model: 'furniture/wall', x: 0, z: BACK_WALL_Z, height: 0 },
  { model: 'furniture/wall', x: TILE_SIZE, z: BACK_WALL_Z, height: 0 },
  { model: 'furniture/wall', x: LEFT_WALL_X, z: -TILE_SIZE, height: 0, quarterTurns: 1 },
  { model: 'furniture/wallWindow', x: LEFT_WALL_X, z: 0, height: 0, quarterTurns: 1 },
  { model: 'furniture/wallDoorway', x: LEFT_WALL_X, z: DOOR_Z, height: 0, quarterTurns: 1 },
];

const FURNITURE: PlaceItem[] = [
  { model: 'furniture/rugRectangle', x: 0.4, z: 0.5 },
  { model: 'furniture/bedSingle', x: -1.8, z: -1.38, blocksMovement: true },
  { model: 'furniture/bear', x: -1.8, z: -1.85, height: FLOOR_HEIGHT + 0.42, sizeFactor: 0.55 },
  { model: 'furniture/lampRoundFloor', x: -1.05, z: -2.05, blocksMovement: true },
  { model: 'furniture/desk', x: -0.05, z: -1.95, blocksMovement: true },
  { model: 'furniture/computerScreen', x: -0.05, z: -2.05, height: DESK_TOP },
  { model: 'furniture/computerKeyboard', x: -0.1, z: -1.8, height: DESK_TOP },
  { model: 'furniture/computerMouse', x: 0.22, z: -1.8, height: DESK_TOP },
  { model: 'furniture/chairDesk', x: -0.05, z: -1.3, quarterTurns: 2, blocksMovement: true },
  { model: 'furniture/bookcaseOpen', x: 1.0, z: -2.05, blocksMovement: true },
  { model: 'furniture/bookcaseOpen', x: 1.68, z: -2.05, blocksMovement: true },
  { model: 'furniture/cardboardBoxClosed', x: 2.05, z: -1.2, blocksMovement: true },
  { model: 'furniture/cardboardBoxOpen', x: 1.95, z: -0.55, blocksMovement: true },
  { model: 'furniture/speaker', x: -2.08, z: 0.3, blocksMovement: true },
  { model: 'furniture/pottedPlant', x: 2.05, z: 2.0, blocksMovement: true },
];

export const BEDROOM: Place = {
  id: 'bedroom',
  items: [...FLOOR, ...WALLS, ...FURNITURE],
  bounds: BOUNDS,
  exits: [
    {
      // The character can get within its own radius of the wall, so this is always reachable.
      area: { minX: BOUNDS.minX, maxX: BOUNDS.minX + 0.35, minZ: DOOR_Z - 0.5, maxZ: DOOR_Z + 0.5 },
      to: 'town',
      arrival: { x: -3.5, z: -0.35, heading: 0 },
    },
  ],
  exitMarkers: [{ x: -2.02, z: DOOR_Z, quarterTurns: 1 }],
  groundHeight: FLOOR_HEIGHT,
  cameraStart: { x: 0, z: 0 },
  fitsOnScreen: true,
};
