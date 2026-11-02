import type { Rect } from './collision';
import type { Npc, Place, PlaceItem } from './world';

const GROUND_HEIGHT = 0.02;

// Big enough to be the park's landmark, with room to walk all the way round it.
export const LAKE: Rect = { minX: -5.5, maxX: 5.5, minZ: -7, maxZ: -1.8 };

export const PARK_FROM_TOWN = { x: -8.6, z: 2, heading: Math.PI / 2 };
export const GRANDPA_POSITION = { x: 3, z: 0 };
export const GRANDPA_TABLE = { x: 3, z: 0.62 };
export const BOY_POSITION = { x: -3.5, z: -1.45 };

const BOUNDS: Rect = { minX: -9.5, maxX: 9.5, minZ: -8.6, maxZ: 3.8 };

const TREES: PlaceItem[] = (
  [
    ['tree-large', -8.4, -7.2],
    ['tree-small', -6.8, -9],
    ['tree-large', -3.4, -9],
    ['tree-small', 0.2, -9],
    ['tree-large', 3.8, -9],
    ['tree-small', 6.9, -9],
    ['tree-large', 8.6, -6.5],
    ['tree-small', 8.8, -2.6],
    ['tree-large', 8.5, 0.6],
    ['tree-small', 8.3, 3.3],
    ['tree-large', 5.2, 3.3],
    ['tree-small', -2.8, 3.4],
    ['tree-large', -6, 3.3],
    ['tree-small', -8.8, -3.2],
    ['tree-large', -8.5, -0.5],
  ] as const
).map(([model, x, z]) => ({
  model: `town/suburban/${model}` as const,
  x,
  z,
  blocksMovement: true,
}));

const GRANDPA: Npc = {
  model: 'character-male-c',
  stock: 'grandpa',
  ...GRANDPA_POSITION,
  heading: 0,
  talkArea: {
    minX: GRANDPA_POSITION.x - 1,
    maxX: GRANDPA_POSITION.x + 1,
    minZ: GRANDPA_POSITION.z - 0.3,
    maxZ: GRANDPA_POSITION.z + 1.6,
  },
};

// On the shore, with his back to the lake he wants a fish from.
const BOY: Npc = {
  model: 'character-female-d',
  stock: 'boy',
  ...BOY_POSITION,
  heading: 0,
  sizeFactor: 0.72,
  talkArea: {
    minX: BOY_POSITION.x - 0.8,
    maxX: BOY_POSITION.x + 0.8,
    minZ: BOY_POSITION.z,
    maxZ: BOY_POSITION.z + 1,
  },
};

export const PARK: Place = {
  id: 'park',
  items: [
    ...TREES,
    {
      model: 'furniture/tableCoffeeSquare',
      ...GRANDPA_TABLE,
      blocksMovement: true,
      color: '#7a5236',
    },
    { model: 'furniture/pottedPlant', x: -6.5, z: 0.5, blocksMovement: true },
    { model: 'town/suburban/planter', x: -2, z: 0, blocksMovement: true },
  ],
  bounds: BOUNDS,
  exits: [
    {
      area: { minX: BOUNDS.minX, maxX: BOUNDS.minX + 0.4, minZ: 0.8, maxZ: 3.2 },
      to: 'town',
      arrival: { x: 12.4, z: 2, heading: -Math.PI / 2 },
    },
  ],
  exitMarkers: [{ x: BOUNDS.minX + 0.45, z: 2, quarterTurns: 1 }],
  npcs: [GRANDPA, BOY],
  water: LAKE,
  groundHeight: GROUND_HEIGHT,
  cameraStart: { x: -6, z: 2 },
  fitsOnScreen: false,
};
