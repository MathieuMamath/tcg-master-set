import {
  ARRIVAL_THROUGH_ROOM_DOOR,
  ROOM_BOUNDS,
  ROOM_DOOR_MARKER,
  ROOM_FLOOR_HEIGHT,
  ROOM_SHELL,
  roomDoorExit,
} from './room-shell';
import type { Arrival, Place, PlaceItem } from './world';

const COUNTER_Z = -0.95;
// Low enough for the camera to see the shopkeeper over it.
const COUNTER_SIZE_FACTOR = 0.7;
const COUNTER_TOP = ROOM_FLOOR_HEIGHT + 0.42 * 1.5 * COUNTER_SIZE_FACTOR;

const COUNTER_PIECES = [-0.7, -0.25, 0.2, 0.65, 1.1];

export const SHOP_BOOKCASES = [-0.66, 0, 0.66];
export const SHOP_BOOKCASE_Z = -2.05;
export const SHOP_DISPLAY_TABLES = [
  { x: 1.6, z: 0.5 },
  { x: -1.25, z: -0.2 },
];
export const SHOP_DISPLAY_TABLE_TOP = ROOM_FLOOR_HEIGHT + 0.23 * 1.5;
export const SHOP_COUNTER_STACK = { x: 0.95, z: COUNTER_Z, height: COUNTER_TOP };

export const SHOPKEEPER_POSITION = { x: 0.2, z: -1.6 };

const FURNITURE: PlaceItem[] = [
  { model: 'furniture/rugSquare', x: 0.2, z: 0.6 },
  ...COUNTER_PIECES.map((x) => ({
    model: 'furniture/kitchenBar' as const,
    x,
    z: COUNTER_Z,
    sizeFactor: COUNTER_SIZE_FACTOR,
    blocksMovement: true,
  })),
  {
    model: 'furniture/computerScreen',
    x: -0.5,
    z: COUNTER_Z,
    height: COUNTER_TOP,
    sizeFactor: 0.7,
  },
  ...SHOP_BOOKCASES.map((x) => ({
    model: 'furniture/bookcaseOpen' as const,
    x,
    z: SHOP_BOOKCASE_Z,
    blocksMovement: true,
  })),
  ...SHOP_DISPLAY_TABLES.map(({ x, z }) => ({
    model: 'furniture/tableCoffeeSquare' as const,
    x,
    z,
    blocksMovement: true,
  })),
  { model: 'furniture/cardboardBoxClosed', x: 2.05, z: -2.05, blocksMovement: true },
  { model: 'furniture/cardboardBoxOpen', x: 1.85, z: -1.45, blocksMovement: true },
  { model: 'furniture/pottedPlant', x: -2.05, z: -2.05, blocksMovement: true },
];

export const SHOP_FROM_TOWN: Arrival = ARRIVAL_THROUGH_ROOM_DOOR;

export const SHOP: Place = {
  id: 'shop',
  items: [...ROOM_SHELL, ...FURNITURE],
  bounds: ROOM_BOUNDS,
  exits: [roomDoorExit('town', { x: 2.9, z: -0.35, heading: 0 })],
  exitMarkers: [ROOM_DOOR_MARKER],
  npcs: [{ model: 'character-female-b', ...SHOPKEEPER_POSITION, heading: 0 }],
  groundHeight: ROOM_FLOOR_HEIGHT,
  cameraStart: { x: 0, z: 0 },
  fitsOnScreen: true,
};
