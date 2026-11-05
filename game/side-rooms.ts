import type { Facing } from './side-walk';
import type { Interaction } from './world';

export type SidePlaceId =
  | 'bedroom'
  | 'town'
  | 'shop'
  | 'bookshop'
  | 'flat'
  | 'arcade'
  | 'park'
  | 'downtown'
  | 'bureau';

export const DOOR_INTERACTIONS = [
  'leaveHome',
  'goHome',
  'enterShop',
  'leaveShop',
  'enterBookshop',
  'leaveBookshop',
  'enterFlat',
  'leaveFlat',
  'enterArcade',
  'leaveArcade',
  'leaveBureau',
] as const;

export type DoorInteraction = (typeof DOOR_INTERACTIONS)[number];

export function isDoorInteraction(interaction: string | null): interaction is DoorInteraction {
  return DOOR_INTERACTIONS.some((door) => door === interaction);
}

// Where a door leads, and where the character then stands, facing which way.
export type SideExit = {
  interaction: DoorInteraction;
  minX: number;
  maxX: number;
  to: SidePlaceId;
  arrival: { x: number; facing: Facing };
};

// An interaction with a character also says where that character stands, for the speech bubble
// that floats over its head.
export type SideInteraction = {
  interaction: Interaction;
  minX: number;
  maxX: number;
  speaker?: { x: number };
};

// A place seen from the side: the character walks along it, and some stretches of the floor let
// the player do something, or go through a door.
export type SideRoom = {
  id: SidePlaceId;
  bounds: { minX: number; maxX: number };
  start: number;
  interactions: readonly SideInteraction[];
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

// The street: Léa's block of flats on the far left, our house, Gaspard's dalgona stand out in the
// open, then the shop, the bookshop, Bérénice's raffle stand, the arcade, and the bus stop at the
// far right, where the bus waits.
export const TOWN_ENDS = { left: -20, right: 38 };
export const TOWN_BUILDINGS = {
  flats: { x: -13.5, width: 4.6, doorX: -12.6 },
  house: { x: -5, width: 4.2, doorX: -5 },
  // Gaspard stands behind his cart, under its awning.
  dalgona: { x: -0.1, width: 3.2, gaspardX: 0 },
  shop: { x: 5, width: 4.8, doorX: 5.9 },
  bookshop: { x: 13.5, width: 4.8, doorX: 14.4 },
  // Bérénice stands behind her counter, its raffle drum on top.
  raffle: { x: 17.7, width: 3.2, bereniceX: 17.2 },
  arcade: { x: 22, width: 5, doorX: 23 },
  // The shelter, its sign by the kerb, and the bus parked past it.
  busStop: { x: 28.9, width: 3.6, signX: 27.4 },
  bus: { x: 34.2, width: 5.6 },
} as const;

// The shop, the Card Den: the raccoon triplets each have a counter, from the newest sets on the
// left, and the door is in the left wall.
export const SHOP_WALLS = { left: -6.5, right: 6.5 };
export const SHOP_COUNTERS = [
  { stock: 'latest', x: -3.6 },
  { stock: 'thisYear', x: 0.5 },
  { stock: 'older', x: 4.6 },
] as const;
export const SHOP_COUNTER_WIDTH = 2.7;

// The bookshop, small and cosy: books everywhere, but only binders for sale. Mamie Noisette stands
// in front of the pile of books she uses as a counter, her till on top, and the door is in the left
// wall.
export const BOOKSHOP_WALLS = { left: -4.6, right: 4.6 };
export const BOOKSHOP_FURNITURE = {
  magazines: { x: -2.5, width: 1.4 },
  pile: { x: 1.15, width: 2 },
  table: { x: 3.2, width: 1.6 },
} as const;
export const BOOKSHOP_SELLER_X = -0.1;

const BOOKSHOP_BOUNDS = {
  minX: BOOKSHOP_WALLS.left + CHARACTER_HALF_WIDTH,
  maxX: BOOKSHOP_WALLS.right - CHARACTER_HALF_WIDTH,
};

// Léa's flat: she works at her desk on the right, too busy to dust, and the door is in the left
// wall.
export const FLAT_WALLS = { left: -5.5, right: 5.5 };
export const FLAT_FURNITURE = {
  shelf: { x: -2.6, width: 1.7 },
  sofa: { x: -0.2, width: 2.6 },
  desk: { x: 3.4, width: 2.8 },
} as const;
// The window over the sofa, and Léa at her desk.
export const FLAT_WINDOW_X = FLAT_FURNITURE.sofa.x;
export const LEA_X = FLAT_FURNITURE.desk.x;

export const FLAT_BOUNDS = {
  minX: FLAT_WALLS.left + CHARACTER_HALF_WIDTH,
  maxX: FLAT_WALLS.right - CHARACTER_HALF_WIDTH,
};
// How far from the door dust can settle, so that arriving never lands on a stain.
export const FLAT_DOOR_REACH = DOOR_REACH;

// The arcade: rows of machines under neon lights. Only the basketball machine can be played, and
// the door is in the left wall.
export const ARCADE_WALLS = { left: -6, right: 6 };
export const ARCADE_MACHINES = {
  cabinetA: { x: -3.6, width: 1.1 },
  cabinetB: { x: -2.3, width: 1.1 },
  basketball: { x: 0.4, width: 2.2 },
  claw: { x: 3, width: 1.5 },
  cabinetC: { x: 4.6, width: 1.1 },
} as const;

const ARCADE_BOUNDS = {
  minX: ARCADE_WALLS.left + CHARACTER_HALF_WIDTH,
  maxX: ARCADE_WALLS.right - CHARACTER_HALF_WIDTH,
};

// The Linden Park, reached by bus: its stop on the left, Papy Caillou beside his bench with his
// cards on it, and Lucas the little otter at the edge of the lake on the right.
export const PARK_ENDS = { left: -10, right: 13 };
export const PARK_SPOTS = {
  busStop: { x: -7.4, width: 3.6, signX: -8.9 },
  bench: { x: -2.6, width: 2.6 },
  papy: { x: -0.6 },
  lake: { left: 4.4, right: 12.6 },
  lucas: { x: 6.2 },
} as const;

// Downtown, behind the village, reached by bus: a wide modern pavement under towers so tall that
// they rise out of sight. The bus stop is on the far left.
export const DOWNTOWN_ENDS = { left: -12, right: 18 };
export const DOWNTOWN_SPOTS = {
  busStop: { x: -9.4, width: 3.6, signX: -10.9 },
  // The statistics bureau's tower, its door in the middle, and Brutus guarding it on its right: the
  // way in is to talk to him.
  bureau: { x: 0.8, width: 4.8, height: 17, doorX: 0.8, brutusX: 2.5 },
} as const;
// The towers along the pavement, and a farther row behind them, from left to right.
export const DOWNTOWN_TOWERS = [
  { x: -4.6, width: 4.4, height: 13, look: 'curtain' },
  { x: 6.4, width: 4.6, height: 12, look: 'setback' },
  { x: 11.8, width: 5, height: 15, look: 'ribbon' },
  { x: 16.6, width: 3.8, height: 13.5, look: 'diagrid' },
] as const;
export const DOWNTOWN_BACK_TOWERS = [
  { x: -8, width: 4, height: 10, look: 'ribbon' },
  { x: -1.8, width: 3.6, height: 12.5, look: 'cylinder' },
  { x: 3.6, width: 4.2, height: 14, look: 'diagrid' },
  { x: 9.2, width: 3.8, height: 10.5, look: 'cylinder' },
  { x: 14.4, width: 4.4, height: 13, look: 'curtain' },
] as const;

// The statistics bureau, high in its tower: a window onto the big city, a wall screen of
// dashboards, Mme Hulotte's desk on the right, and the door in the left wall. Only admins get past
// Brutus to come in.
export const BUREAU_WALLS = { left: -6, right: 6 };
export const BUREAU_FURNITURE = {
  window: { x: -2.6, width: 4.6 },
  // A sofa before the window, to sit and look at the city.
  sofa: { x: -2.6, width: 2.8 },
  plant: { x: -5, width: 1 },
  screen: { x: 1, width: 2.2 },
  desk: { x: 3.2, width: 2.8 },
  cornerPlant: { x: 5.2, width: 0.9 },
} as const;
export const HULOTTE_X = BUREAU_FURNITURE.desk.x;

const BUREAU_BOUNDS = {
  minX: BUREAU_WALLS.left + CHARACTER_HALF_WIDTH,
  maxX: BUREAU_WALLS.right - CHARACTER_HALF_WIDTH,
};

const DOWNTOWN_BOUNDS = {
  minX: DOWNTOWN_ENDS.left + CHARACTER_HALF_WIDTH,
  maxX: DOWNTOWN_ENDS.right - CHARACTER_HALF_WIDTH,
};

const PARK_BOUNDS = {
  minX: PARK_ENDS.left + CHARACTER_HALF_WIDTH,
  maxX: PARK_ENDS.right - CHARACTER_HALF_WIDTH,
};

const SHOP_BOUNDS = {
  minX: SHOP_WALLS.left + CHARACTER_HALF_WIDTH,
  maxX: SHOP_WALLS.right - CHARACTER_HALF_WIDTH,
};

const BEDROOM_BOUNDS = {
  minX: BEDROOM_WALLS.left + CHARACTER_HALF_WIDTH,
  maxX: BEDROOM_WALLS.right - CHARACTER_HALF_WIDTH,
};

export const BEDROOM: SideRoom = {
  id: 'bedroom',
  bounds: BEDROOM_BOUNDS,
  start: -1.2,
  // The binders are kept on the bookcase, and Pip sleeps in the bed against the left wall.
  interactions: [
    {
      interaction: 'bed',
      minX: BEDROOM_BOUNDS.minX,
      maxX: BEDROOM_FURNITURE.bed.x + BEDROOM_FURNITURE.bed.width / 2,
    },
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
  // The bus stop's sign opens the map of the stops the bus serves.
  interactions: [
    {
      interaction: 'gaspard',
      minX: TOWN_BUILDINGS.dalgona.gaspardX - 1.3,
      maxX: TOWN_BUILDINGS.dalgona.gaspardX + 1.3,
      speaker: { x: TOWN_BUILDINGS.dalgona.gaspardX },
    },
    {
      interaction: 'berenice',
      minX: TOWN_BUILDINGS.raffle.bereniceX - 1.3,
      maxX: TOWN_BUILDINGS.raffle.bereniceX + 1.3,
      speaker: { x: TOWN_BUILDINGS.raffle.bereniceX },
    },
    {
      interaction: 'busStop',
      minX: TOWN_BUILDINGS.busStop.signX - DOOR_REACH,
      maxX: TOWN_BUILDINGS.busStop.signX + DOOR_REACH,
    },
  ],
  exits: [
    {
      interaction: 'enterShop',
      minX: TOWN_BUILDINGS.shop.doorX - DOOR_REACH,
      maxX: TOWN_BUILDINGS.shop.doorX + DOOR_REACH,
      to: 'shop',
      arrival: { x: SHOP_BOUNDS.minX, facing: 1 },
    },
    {
      interaction: 'enterBookshop',
      minX: TOWN_BUILDINGS.bookshop.doorX - DOOR_REACH,
      maxX: TOWN_BUILDINGS.bookshop.doorX + DOOR_REACH,
      to: 'bookshop',
      arrival: { x: BOOKSHOP_BOUNDS.minX, facing: 1 },
    },
    {
      interaction: 'enterArcade',
      minX: TOWN_BUILDINGS.arcade.doorX - DOOR_REACH,
      maxX: TOWN_BUILDINGS.arcade.doorX + DOOR_REACH,
      to: 'arcade',
      arrival: { x: ARCADE_BOUNDS.minX, facing: 1 },
    },
    {
      interaction: 'enterFlat',
      minX: TOWN_BUILDINGS.flats.doorX - DOOR_REACH,
      maxX: TOWN_BUILDINGS.flats.doorX + DOOR_REACH,
      to: 'flat',
      arrival: { x: FLAT_BOUNDS.minX, facing: 1 },
    },
    {
      interaction: 'goHome',
      minX: TOWN_BUILDINGS.house.doorX - DOOR_REACH,
      maxX: TOWN_BUILDINGS.house.doorX + DOOR_REACH,
      to: 'bedroom',
      arrival: { x: BEDROOM_BOUNDS.maxX, facing: -1 },
    },
  ],
};

export const SHOP: SideRoom = {
  id: 'shop',
  bounds: SHOP_BOUNDS,
  start: SHOP_BOUNDS.minX,
  interactions: SHOP_COUNTERS.map(({ stock, x }) => ({
    interaction: stock,
    minX: x - SHOP_COUNTER_WIDTH / 2,
    maxX: x + SHOP_COUNTER_WIDTH / 2,
    speaker: { x },
  })),
  exits: [
    {
      interaction: 'leaveShop',
      minX: SHOP_BOUNDS.minX,
      maxX: SHOP_BOUNDS.minX + DOOR_REACH,
      to: 'town',
      arrival: { x: TOWN_BUILDINGS.shop.doorX, facing: -1 },
    },
  ],
};

export const BOOKSHOP: SideRoom = {
  id: 'bookshop',
  bounds: BOOKSHOP_BOUNDS,
  start: BOOKSHOP_BOUNDS.minX,
  interactions: [
    {
      interaction: 'binderSeller',
      minX: BOOKSHOP_SELLER_X - 1,
      maxX: BOOKSHOP_SELLER_X + 1,
      speaker: { x: BOOKSHOP_SELLER_X },
    },
  ],
  exits: [
    {
      interaction: 'leaveBookshop',
      minX: BOOKSHOP_BOUNDS.minX,
      maxX: BOOKSHOP_BOUNDS.minX + DOOR_REACH,
      to: 'town',
      arrival: { x: TOWN_BUILDINGS.bookshop.doorX, facing: -1 },
    },
  ],
};

export const FLAT: SideRoom = {
  id: 'flat',
  bounds: FLAT_BOUNDS,
  start: FLAT_BOUNDS.minX,
  interactions: [
    {
      interaction: 'grandma',
      minX: LEA_X - 1.1,
      maxX: LEA_X + 1.1,
      speaker: { x: LEA_X },
    },
  ],
  exits: [
    {
      interaction: 'leaveFlat',
      minX: FLAT_BOUNDS.minX,
      maxX: FLAT_BOUNDS.minX + DOOR_REACH,
      to: 'town',
      arrival: { x: TOWN_BUILDINGS.flats.doorX, facing: 1 },
    },
  ],
};

const { basketball } = ARCADE_MACHINES;

export const ARCADE: SideRoom = {
  id: 'arcade',
  bounds: ARCADE_BOUNDS,
  start: ARCADE_BOUNDS.minX,
  interactions: [
    {
      interaction: 'basketball',
      minX: basketball.x - basketball.width / 2,
      maxX: basketball.x + basketball.width / 2,
    },
  ],
  exits: [
    {
      interaction: 'leaveArcade',
      minX: ARCADE_BOUNDS.minX,
      maxX: ARCADE_BOUNDS.minX + DOOR_REACH,
      to: 'town',
      arrival: { x: TOWN_BUILDINGS.arcade.doorX, facing: -1 },
    },
  ],
};

export const PARK: SideRoom = {
  id: 'park',
  bounds: PARK_BOUNDS,
  start: PARK_SPOTS.busStop.signX + 0.5,
  interactions: [
    {
      interaction: 'busStop',
      minX: PARK_SPOTS.busStop.signX - DOOR_REACH,
      maxX: PARK_SPOTS.busStop.signX + DOOR_REACH,
    },
    {
      interaction: 'grandpa',
      minX: PARK_SPOTS.papy.x - 1.1,
      maxX: PARK_SPOTS.papy.x + 1.1,
      speaker: { x: PARK_SPOTS.papy.x },
    },
    {
      interaction: 'boy',
      minX: PARK_SPOTS.lucas.x - 1,
      maxX: PARK_SPOTS.lucas.x + 1,
      speaker: { x: PARK_SPOTS.lucas.x },
    },
  ],
  // The park is left by bus, from the stop's sign.
  exits: [],
};

export const DOWNTOWN: SideRoom = {
  id: 'downtown',
  bounds: DOWNTOWN_BOUNDS,
  start: DOWNTOWN_SPOTS.busStop.signX + 0.5,
  interactions: [
    {
      interaction: 'busStop',
      minX: DOWNTOWN_SPOTS.busStop.signX - DOOR_REACH,
      maxX: DOWNTOWN_SPOTS.busStop.signX + DOOR_REACH,
    },
    {
      interaction: 'brutus',
      minX: DOWNTOWN_SPOTS.bureau.doorX - 0.6,
      maxX: DOWNTOWN_SPOTS.bureau.brutusX + 1,
      speaker: { x: DOWNTOWN_SPOTS.bureau.brutusX },
    },
  ],
  // Downtown is left by bus, from the stop's sign. The bureau has no door of its own to use: Brutus
  // lets admins in.
  exits: [],
};

// Where Brutus lets an admin in, through the bureau's door.
export const BUREAU_ENTRANCE = {
  from: 'downtown',
  to: 'bureau',
  arrival: { x: BUREAU_BOUNDS.minX, facing: 1 },
} as const satisfies { from: SidePlaceId; to: SidePlaceId; arrival: { x: number; facing: Facing } };

export const BUREAU: SideRoom = {
  id: 'bureau',
  bounds: BUREAU_BOUNDS,
  start: BUREAU_BOUNDS.minX,
  interactions: [
    {
      interaction: 'hulotte',
      minX: HULOTTE_X - 1.2,
      maxX: HULOTTE_X + 1.2,
      speaker: { x: HULOTTE_X },
    },
  ],
  exits: [
    {
      interaction: 'leaveBureau',
      minX: BUREAU_BOUNDS.minX,
      maxX: BUREAU_BOUNDS.minX + DOOR_REACH,
      to: 'downtown',
      arrival: { x: DOWNTOWN_SPOTS.bureau.doorX, facing: 1 },
    },
  ],
};

export const SIDE_PLACES: Record<SidePlaceId, SideRoom> = {
  bedroom: BEDROOM,
  town: TOWN,
  shop: SHOP,
  bookshop: BOOKSHOP,
  flat: FLAT,
  arcade: ARCADE,
  park: PARK,
  downtown: DOWNTOWN,
  bureau: BUREAU,
};

export function exitAlong(room: SideRoom, x: number): SideExit | null {
  return room.exits.find(({ minX, maxX }) => x >= minX && x <= maxX) ?? null;
}

// The character the player can talk to from here, if any.
export function speakerAlong(
  room: SideRoom,
  x: number,
): { interaction: Interaction; x: number } | null {
  const found = room.interactions.find(({ minX, maxX }) => x >= minX && x <= maxX);
  return found?.speaker ? { interaction: found.interaction, x: found.speaker.x } : null;
}

export function interactionAlong(room: SideRoom, x: number): Interaction | DoorInteraction | null {
  return (
    exitAlong(room, x)?.interaction ??
    room.interactions.find(({ minX, maxX }) => x >= minX && x <= maxX)?.interaction ??
    null
  );
}
