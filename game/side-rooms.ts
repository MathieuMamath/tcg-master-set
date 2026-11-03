import type { Facing } from './side-walk';
import type { Interaction } from './world';

export type SidePlaceId = 'bedroom' | 'town';

export type DoorInteraction = 'leaveHome' | 'goHome';

// Where a door leads, and where the character then stands, facing which way.
export type SideExit = {
  interaction: DoorInteraction;
  minX: number;
  maxX: number;
  to: SidePlaceId;
  arrival: { x: number; facing: Facing };
};

// A place seen from the side: the character walks along it, and some stretches of the floor let
// the player do something, or go through a door.
export type SideRoom = {
  id: SidePlaceId;
  bounds: { minX: number; maxX: number };
  start: number;
  interactions: readonly { interaction: Interaction; minX: number; maxX: number }[];
  exits: readonly SideExit[];
};

// Pip is about this wide, so he stops before his nose touches a wall.
const CHARACTER_HALF_WIDTH = 0.75;
const DOOR_REACH = 0.6;

// The bed stands right against the left wall, and the door is in the right one.
export const BEDROOM_WALLS = { left: -5.5, right: 6.5 };
// Where each piece of furniture stands, by its middle, and how wide it is.
export const BEDROOM_FURNITURE = {
  bed: { x: -3.9, width: 3.2 },
  desk: { x: 0.9, width: 2.3 },
  chair: { x: 1.35, width: 0.95 },
  bookcase: { x: 3.95, width: 1.7 },
  plant: { x: 5.6, width: 1.3 },
} as const;

// The street: our house on the left, and the shop on the right, which hasn't opened yet.
export const TOWN_ENDS = { left: -12, right: 12 };
export const TOWN_BUILDINGS = {
  house: { x: -5, width: 4.2, doorX: -5 },
  shop: { x: 5, width: 4.8, doorX: 5.9 },
} as const;

const BEDROOM_BOUNDS = {
  minX: BEDROOM_WALLS.left + CHARACTER_HALF_WIDTH,
  maxX: BEDROOM_WALLS.right - CHARACTER_HALF_WIDTH,
};

export const BEDROOM: SideRoom = {
  id: 'bedroom',
  bounds: BEDROOM_BOUNDS,
  start: -1.2,
  // The binders are kept on the bookcase.
  interactions: [
    {
      interaction: 'binder',
      minX: BEDROOM_FURNITURE.bookcase.x - BEDROOM_FURNITURE.bookcase.width / 2 - 0.3,
      maxX: BEDROOM_FURNITURE.bookcase.x + BEDROOM_FURNITURE.bookcase.width / 2 + 0.3,
    },
  ],
  exits: [
    {
      interaction: 'leaveHome',
      minX: BEDROOM_BOUNDS.maxX - DOOR_REACH,
      maxX: BEDROOM_BOUNDS.maxX,
      to: 'town',
      arrival: { x: TOWN_BUILDINGS.house.doorX, facing: 1 },
    },
  ],
};

export const TOWN: SideRoom = {
  id: 'town',
  bounds: {
    minX: TOWN_ENDS.left + CHARACTER_HALF_WIDTH,
    maxX: TOWN_ENDS.right - CHARACTER_HALF_WIDTH,
  },
  start: TOWN_BUILDINGS.house.doorX,
  interactions: [],
  exits: [
    {
      interaction: 'goHome',
      minX: TOWN_BUILDINGS.house.doorX - DOOR_REACH,
      maxX: TOWN_BUILDINGS.house.doorX + DOOR_REACH,
      to: 'bedroom',
      arrival: { x: BEDROOM_BOUNDS.maxX, facing: -1 },
    },
  ],
};

export const SIDE_PLACES: Record<SidePlaceId, SideRoom> = { bedroom: BEDROOM, town: TOWN };

export function exitAlong(room: SideRoom, x: number): SideExit | null {
  return room.exits.find(({ minX, maxX }) => x >= minX && x <= maxX) ?? null;
}

export function interactionAlong(room: SideRoom, x: number): Interaction | DoorInteraction | null {
  return (
    exitAlong(room, x)?.interaction ??
    room.interactions.find(({ minX, maxX }) => x >= minX && x <= maxX)?.interaction ??
    null
  );
}
