import { buildRoom, ROOM_FLOOR_HEIGHT } from './room-shell';
import type { Place, PlaceItem } from './world';

const ROOM = buildRoom(6, 4, { floor: '#3f3a63', wall: '#6a5acd' });

export const ARCADE_FROM_TOWN = ROOM.arrival;
export const ARCADE_WALL_Z = ROOM.bounds.minZ;
export const ARCADE_NEON = '#ff4fa3';
export const BASKETBALL_MACHINE = { x: 1.1, z: -2.2 };

const MACHINE_FRONT_Z = BASKETBALL_MACHINE.z + 0.76;

function machine(
  model: PlaceItem['model'],
  x: number,
  z: number,
  quarterTurns?: number,
): PlaceItem {
  return { model, x, z, quarterTurns, height: ROOM_FLOOR_HEIGHT, blocksMovement: true };
}

const MACHINES: PlaceItem[] = [
  machine('arcade/arcade-machine', -3.95, -2.55),
  machine('arcade/arcade-machine', -3.3, -2.55),
  machine('arcade/pinball', -2.35, -2.4),
  machine('arcade/dance-machine', -1, -2.2),
  machine('arcade/basketball-game', BASKETBALL_MACHINE.x, BASKETBALL_MACHINE.z),
  machine('arcade/claw-machine', 2.6, -2.45),
  machine('arcade/vending-machine', 3.9, -2.6),
  machine('arcade/ticket-machine', 4.1, -1.3, 3),
  machine('arcade/gambling-machine', 4.05, -0.45, 3),
  machine('arcade/gambling-machine', 4.05, 0.35, 3),
  machine('arcade/prize-wheel', 4.2, 1.2, 3),
  machine('arcade/air-hockey', -1.9, 0.2),
  machine('arcade/cash-register', 2.8, 2.4),
  machine('arcade/prizes', 3.85, 2.6),
];

export const ARCADE: Place = {
  id: 'arcade',
  items: [...ROOM.items, ...MACHINES],
  bounds: ROOM.bounds,
  exits: [ROOM.doorExit('town', { x: -17.1, z: -0.35, heading: 0 })],
  exitMarkers: [ROOM.doorMarker],
  npcs: [],
  basketballArea: {
    minX: BASKETBALL_MACHINE.x - 0.6,
    maxX: BASKETBALL_MACHINE.x + 0.6,
    minZ: MACHINE_FRONT_Z,
    maxZ: MACHINE_FRONT_Z + 0.8,
  },
  groundHeight: ROOM_FLOOR_HEIGHT,
  cameraStart: { x: 0, z: 0 },
  fitsOnScreen: false,
};
