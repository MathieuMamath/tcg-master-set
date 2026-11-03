import type { Interaction } from './world';

// A place seen from the side: the character walks along it, and some stretches of the floor let
// the player do something.
export type SideRoom = {
  bounds: { minX: number; maxX: number };
  start: number;
  interactions: readonly { interaction: Interaction; minX: number; maxX: number }[];
};

// The bed stands right against the left wall.
export const BEDROOM_WALLS = { left: -5.5, right: 6.5 };
// Where each piece of furniture stands, by its middle, and how wide it is.
export const BEDROOM_FURNITURE = {
  bed: { x: -3.9, width: 3.2 },
  desk: { x: 0.9, width: 2.3 },
  chair: { x: 1.35, width: 0.95 },
  bookcase: { x: 3.95, width: 1.7 },
  plant: { x: 5.6, width: 1.3 },
} as const;

// Pip is about this wide, so he stops before his nose touches a wall.
const CHARACTER_HALF_WIDTH = 0.75;

export const BEDROOM: SideRoom = {
  bounds: {
    minX: BEDROOM_WALLS.left + CHARACTER_HALF_WIDTH,
    maxX: BEDROOM_WALLS.right - CHARACTER_HALF_WIDTH,
  },
  start: -1.2,
  // The binders are kept on the bookcase.
  interactions: [
    {
      interaction: 'binder',
      minX: BEDROOM_FURNITURE.bookcase.x - BEDROOM_FURNITURE.bookcase.width / 2 - 0.3,
      maxX: BEDROOM_FURNITURE.bookcase.x + BEDROOM_FURNITURE.bookcase.width / 2 + 0.3,
    },
  ],
};

export function interactionAlong(room: SideRoom, x: number): Interaction | null {
  return room.interactions.find(({ minX, maxX }) => x >= minX && x <= maxX)?.interaction ?? null;
}
