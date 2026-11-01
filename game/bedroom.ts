import { buildRoom, ROOM_FLOOR_HEIGHT } from './room-shell';
import type { Arrival, Place, PlaceItem } from './world';

const ROOM = buildRoom(3, 3);
const FLOOR_HEIGHT = ROOM_FLOOR_HEIGHT;
export const DESK_TOP = FLOOR_HEIGHT + 0.384 * 1.5;

export const BEDROOM_START: Arrival = { x: 0.4, z: 0.7, heading: 0 };
export const BEDROOM_FROM_TOWN: Arrival = ROOM.arrival;

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
  items: [...ROOM.items, ...FURNITURE],
  bounds: ROOM.bounds,
  exits: [ROOM.doorExit('town', { x: -3.5, z: -0.35, heading: 0 })],
  exitMarkers: [ROOM.doorMarker],
  npcs: [],
  // The floor in front of the bookcases.
  binderArea: { minX: 0.6, maxX: 2.1, minZ: -1.9, maxZ: -1.2 },
  groundHeight: FLOOR_HEIGHT,
  cameraStart: { x: 0, z: 0 },
  fitsOnScreen: true,
};
