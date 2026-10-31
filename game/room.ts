import { moveWithCollisions, type Rect } from './collision';
import { type CharacterState, type Direction, stepCharacter } from './movement';

// The furniture is scaled up to suit the character's chibi proportions.
export const FURNITURE_SCALE = 1.5;
export const FLOOR_TILE_SIZE = FURNITURE_SCALE;
export const FLOOR_HEIGHT = 0.05 * FURNITURE_SCALE;
export const DESK_HEIGHT = 0.384 * FURNITURE_SCALE;
export const WALL_HEIGHT = 1.29 * FURNITURE_SCALE;

const TILES_PER_SIDE = 3;
const ROOM_HALF_SIZE = (TILES_PER_SIDE * FLOOR_TILE_SIZE) / 2;
const CHARACTER_RADIUS = 0.25;

export const ROOM_BOUNDS: Rect = {
  minX: -ROOM_HALF_SIZE,
  maxX: ROOM_HALF_SIZE,
  minZ: -ROOM_HALF_SIZE,
  maxZ: ROOM_HALF_SIZE,
};

export const CHARACTER_START: CharacterState = { x: 0.4, z: 0.7, heading: 0, isMoving: false };

// Measured from the model files, before scaling: [width, depth].
const FOOTPRINTS = {
  bear: [0.39, 0.247],
  bedSingle: [0.571, 1.125],
  bookcaseOpen: [0.4, 0.25],
  cardboardBoxClosed: [0.212, 0.212],
  cardboardBoxOpen: [0.372, 0.212],
  chairDesk: [0.335, 0.314],
  computerKeyboard: [0.282, 0.118],
  computerMouse: [0.05, 0.085],
  computerScreen: [0.393, 0.104],
  desk: [0.734, 0.392],
  floorFull: [1, 1],
  lampRoundFloor: [0.152, 0.176],
  pottedPlant: [0.212, 0.242],
  rugRectangle: [1.57, 0.92],
  speaker: [0.148, 0.148],
  wall: [1, 0.05],
  wallWindow: [1, 0.09],
} as const;

export type FurnitureModel = keyof typeof FOOTPRINTS;

export type RoomItem = {
  model: FurnitureModel;
  x: number;
  z: number;
  height?: number;
  quarterTurns?: number;
  scale?: number;
  blocksMovement?: boolean;
};

const BACK_WALL_Z = ROOM_BOUNDS.minZ - 0.04;
const LEFT_WALL_X = ROOM_BOUNDS.minX - 0.04;

const FLOOR: RoomItem[] = [-1, 0, 1].flatMap((column) =>
  [-1, 0, 1].map((row) => ({
    model: 'floorFull' as const,
    x: column * FLOOR_TILE_SIZE,
    z: row * FLOOR_TILE_SIZE,
    height: 0,
  })),
);

const WALLS: RoomItem[] = [
  { model: 'wall', x: -FLOOR_TILE_SIZE, z: BACK_WALL_Z, height: 0 },
  { model: 'wall', x: 0, z: BACK_WALL_Z, height: 0 },
  { model: 'wall', x: FLOOR_TILE_SIZE, z: BACK_WALL_Z, height: 0 },
  { model: 'wall', x: LEFT_WALL_X, z: -FLOOR_TILE_SIZE, height: 0, quarterTurns: 1 },
  { model: 'wallWindow', x: LEFT_WALL_X, z: 0, height: 0, quarterTurns: 1 },
  { model: 'wall', x: LEFT_WALL_X, z: FLOOR_TILE_SIZE, height: 0, quarterTurns: 1 },
];

const FURNITURE: RoomItem[] = [
  { model: 'rugRectangle', x: 0.4, z: 0.5 },
  { model: 'bedSingle', x: -1.8, z: -1.38, blocksMovement: true },
  { model: 'bear', x: -1.8, z: -1.85, height: FLOOR_HEIGHT + 0.42, scale: 0.55 },
  { model: 'lampRoundFloor', x: -1.05, z: -2.05, blocksMovement: true },
  { model: 'desk', x: -0.05, z: -1.95, blocksMovement: true },
  { model: 'computerScreen', x: -0.05, z: -2.05, height: FLOOR_HEIGHT + DESK_HEIGHT },
  { model: 'computerKeyboard', x: -0.1, z: -1.8, height: FLOOR_HEIGHT + DESK_HEIGHT },
  { model: 'computerMouse', x: 0.22, z: -1.8, height: FLOOR_HEIGHT + DESK_HEIGHT },
  { model: 'chairDesk', x: -0.05, z: -1.3, quarterTurns: 2, blocksMovement: true },
  { model: 'bookcaseOpen', x: 1.0, z: -2.05, blocksMovement: true },
  { model: 'bookcaseOpen', x: 1.68, z: -2.05, blocksMovement: true },
  { model: 'cardboardBoxClosed', x: 2.05, z: -1.2, blocksMovement: true },
  { model: 'cardboardBoxOpen', x: 1.95, z: -0.55, blocksMovement: true },
  { model: 'speaker', x: -2.08, z: 0.75, blocksMovement: true },
  { model: 'pottedPlant', x: -2.05, z: 2.05, blocksMovement: true },
];

export const ROOM_ITEMS: readonly RoomItem[] = [...FLOOR, ...WALLS, ...FURNITURE];

export const ROOM_OBSTACLES: readonly Rect[] = FURNITURE.filter((item) => item.blocksMovement).map(
  footprintOf,
);

export function footprintOf(item: RoomItem): Rect {
  const [width, depth] = FOOTPRINTS[item.model];
  const isSideways = (item.quarterTurns ?? 0) % 2 === 1;
  const halfX = ((isSideways ? depth : width) * FURNITURE_SCALE) / 2;
  const halfZ = ((isSideways ? width : depth) * FURNITURE_SCALE) / 2;

  return {
    minX: item.x - halfX,
    maxX: item.x + halfX,
    minZ: item.z - halfZ,
    maxZ: item.z + halfZ,
  };
}

export function stepInRoom(
  state: CharacterState,
  direction: Direction,
  delta: number,
): CharacterState {
  const next = stepCharacter(state, direction, delta);
  const position = moveWithCollisions(state, next, ROOM_OBSTACLES, ROOM_BOUNDS, CHARACTER_RADIUS);

  return { ...next, ...position };
}
