import { buildRoom, ROOM_FLOOR_HEIGHT } from './room-shell';
import type { Npc, Place, PlaceItem } from './world';

const ROOM = buildRoom(3, 3, { floor: '#c9b48f', wall: '#e9dcc9' });
const FURNITURE_COLOR = '#7a5236';

export const APARTMENT_FROM_TOWN = ROOM.arrival;
export const GRANDMA_POSITION = { x: 1.5, z: -1.6 };

const FURNITURE: PlaceItem[] = [
  { model: 'furniture/rugSquare', x: 1.5, z: -1.05, color: '#b0617a', height: ROOM_FLOOR_HEIGHT },
  { model: 'furniture/bedSingle', x: -1.8, z: -1.38, blocksMovement: true },
  {
    model: 'furniture/bookcaseOpen',
    x: -0.4,
    z: -2.05,
    blocksMovement: true,
    color: FURNITURE_COLOR,
  },
  { model: 'furniture/lampRoundFloor', x: 0.5, z: -2.05, blocksMovement: true },
  {
    model: 'furniture/tableCoffeeSquare',
    x: -1.1,
    z: 0.9,
    blocksMovement: true,
    color: FURNITURE_COLOR,
  },
  { model: 'furniture/pottedPlant', x: 2.05, z: 2.0, blocksMovement: true },
  { model: 'furniture/pottedPlant', x: 2.05, z: 0.1, blocksMovement: true },
];

const GRANDMA: Npc = {
  model: 'character-female-b',
  stock: 'grandma',
  ...GRANDMA_POSITION,
  heading: 0,
  talkArea: {
    minX: GRANDMA_POSITION.x - 0.8,
    maxX: GRANDMA_POSITION.x + 0.75,
    minZ: GRANDMA_POSITION.z,
    maxZ: GRANDMA_POSITION.z + 1,
  },
};

export const APARTMENT: Place = {
  id: 'apartment',
  items: [...ROOM.items, ...FURNITURE],
  bounds: ROOM.bounds,
  exits: [ROOM.doorExit('town', { x: -10, z: -0.35, heading: 0 })],
  exitMarkers: [ROOM.doorMarker],
  npcs: [GRANDMA],
  groundHeight: ROOM_FLOOR_HEIGHT,
  cameraStart: { x: 0, z: 0 },
  fitsOnScreen: true,
};
