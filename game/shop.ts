import { buildRoom, ROOM_FLOOR_HEIGHT } from './room-shell';
import type { Npc, Place, PlaceItem } from './world';

const ROOM = buildRoom(5, 4, { floor: '#8d7fd1', wall: '#b9a6ff' });

const COUNTER_Z = -1.55;
// Low enough for the camera to see the shopkeeper over it.
const COUNTER_SIZE_FACTOR = 0.7;
const COUNTER_TOP = ROOM_FLOOR_HEIGHT + 0.42 * 1.5 * COUNTER_SIZE_FACTOR;
const COUNTER_PIECES = [-0.45, 0, 0.45];
const SHOPKEEPER_Z = -2.2;

// One counter per shopkeeper, each with its own neon colour on the wall behind it.
export const SHOP_STATIONS = [
  { x: -2.4, stock: 'latest', model: 'character-female-b', neon: '#ffc83d' },
  { x: 0, stock: 'thisYear', model: 'character-male-c', neon: '#31e0d8' },
  { x: 2.4, stock: 'older', model: 'character-female-d', neon: '#ff4fa3' },
] as const;

export const SHOPKEEPER_POSITION = { x: SHOP_STATIONS[1].x, z: SHOPKEEPER_Z };

export const SHOP_BOOKCASE_Z = ROOM.bounds.minZ + 0.2;
export const SHOP_BOOKCASES = SHOP_STATIONS.flatMap(({ x }) => [x - 0.33, x + 0.33]);
export const SHOP_RACKS = [
  { x: -1.3, z: 0.1 },
  { x: 1.3, z: 0.1 },
  { x: 3.2, z: 0.9 },
  { x: 3.2, z: 2.2 },
];
export const SHOP_COUNTER_TOP = COUNTER_TOP;
export const SHOP_COUNTER_Z = COUNTER_Z;
export const SHOP_RACK_BASE_TOP = ROOM_FLOOR_HEIGHT + 0.23 * 1.5;
export const SHOP_WALL_Z = ROOM.bounds.minZ - 0.01;
export const SHOP_LEFT_WALL_X = ROOM.bounds.minX - 0.01;
export const SHOP_WIDTH = ROOM.bounds.maxX - ROOM.bounds.minX;
export const SHOP_DEPTH = ROOM.bounds.maxZ - ROOM.bounds.minZ;

const FURNITURE_COLOR = '#4b3f8f';

const FURNITURE: PlaceItem[] = [
  { model: 'furniture/rugRectangle', x: 0, z: 1.4, color: '#6d28d9', height: ROOM_FLOOR_HEIGHT },
  ...SHOP_STATIONS.flatMap(({ x, neon }) => [
    { model: 'furniture/rugSquare' as const, x, z: -0.85, color: neon, sizeFactor: 0.95 },
    ...COUNTER_PIECES.map((offset) => ({
      model: 'furniture/kitchenBar' as const,
      x: x + offset,
      z: COUNTER_Z,
      sizeFactor: COUNTER_SIZE_FACTOR,
      blocksMovement: true,
      color: neon,
    })),
    {
      model: 'furniture/computerScreen' as const,
      x: x - 0.35,
      z: COUNTER_Z,
      height: COUNTER_TOP,
      sizeFactor: 0.7,
    },
  ]),
  ...SHOP_BOOKCASES.map((x) => ({
    model: 'furniture/bookcaseOpen' as const,
    x,
    z: SHOP_BOOKCASE_Z,
    blocksMovement: true,
    color: FURNITURE_COLOR,
  })),
  ...SHOP_RACKS.map(({ x, z }) => ({
    model: 'furniture/tableCoffeeSquare' as const,
    x,
    z,
    blocksMovement: true,
    color: FURNITURE_COLOR,
  })),
  { model: 'furniture/speaker', x: -3.45, z: -2.75, blocksMovement: true },
  { model: 'furniture/speaker', x: 3.45, z: -2.75, blocksMovement: true },
];

export const SHOP_FROM_TOWN = ROOM.arrival;

const SHOPKEEPERS: Npc[] = SHOP_STATIONS.map(({ x, stock, model }) => ({
  model,
  stock,
  x,
  z: SHOPKEEPER_Z,
  heading: 0,
  // The floor just in front of the counter.
  talkArea: { minX: x - 0.85, maxX: x + 0.85, minZ: -1.35, maxZ: -0.6 },
}));

export const SHOP: Place = {
  id: 'shop',
  items: [...ROOM.items, ...FURNITURE],
  bounds: ROOM.bounds,
  exits: [ROOM.doorExit('town', { x: 2.9, z: -0.35, heading: 0 })],
  exitMarkers: [ROOM.doorMarker],
  npcs: SHOPKEEPERS,
  groundHeight: ROOM_FLOOR_HEIGHT,
  cameraStart: { x: 0, z: 0 },
  fitsOnScreen: false,
};
