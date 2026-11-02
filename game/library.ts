import { buildRoom, ROOM_FLOOR_HEIGHT } from './room-shell';
import type { Npc, Place, PlaceItem } from './world';

const ROOM = buildRoom(4, 3, { floor: '#a9825a', wall: '#ead9bd' });

const COUNTER_Z = -0.95;
const COUNTER_SIZE_FACTOR = 0.7;
const COUNTER_PIECES = [-0.45, 0, 0.45];
const SELLER_X = 0;
const SELLER_Z = -1.6;
const SHELF_COLOR = '#6b4326';

export const LIBRARY_COUNTER_TOP = ROOM_FLOOR_HEIGHT + 0.42 * 1.5 * COUNTER_SIZE_FACTOR;
export const LIBRARY_COUNTER_Z = COUNTER_Z;
export const LIBRARY_BOOKCASE_Z = ROOM.bounds.minZ + 0.2;
// Along the back wall, behind the seller, like the shelves of a small town library.
export const LIBRARY_BOOKCASES = [-2.32, -1.64, -0.96, -0.33, 0.33, 0.96, 1.64, 2.32];
export const LIBRARY_FROM_TOWN = ROOM.arrival;

const FURNITURE: PlaceItem[] = [
  { model: 'furniture/rugRectangle', x: 0.3, z: 0.8, color: '#7a2e2e', height: ROOM_FLOOR_HEIGHT },
  ...COUNTER_PIECES.map((offset) => ({
    model: 'furniture/kitchenBar' as const,
    x: SELLER_X + offset,
    z: COUNTER_Z,
    sizeFactor: COUNTER_SIZE_FACTOR,
    blocksMovement: true,
    color: SHELF_COLOR,
  })),
  ...LIBRARY_BOOKCASES.map((x) => ({
    model: 'furniture/bookcaseOpen' as const,
    x,
    z: LIBRARY_BOOKCASE_Z,
    blocksMovement: true,
    color: SHELF_COLOR,
  })),
  { model: 'furniture/pottedPlant', x: 2.6, z: 1.8, blocksMovement: true },
];

const SELLER: Npc = {
  model: 'character-female-d',
  stock: 'binderSeller',
  x: SELLER_X,
  z: SELLER_Z,
  heading: 0,
  // The floor just in front of the counter.
  talkArea: { minX: SELLER_X - 0.85, maxX: SELLER_X + 0.85, minZ: -0.75, maxZ: 0 },
};

export const LIBRARY: Place = {
  id: 'library',
  items: [...ROOM.items, ...FURNITURE],
  bounds: ROOM.bounds,
  exits: [ROOM.doorExit('town', { x: 10, z: -0.35, heading: 0 })],
  exitMarkers: [ROOM.doorMarker],
  npcs: [SELLER],
  groundHeight: ROOM_FLOOR_HEIGHT,
  cameraStart: { x: 0, z: 0 },
  fitsOnScreen: true,
};
