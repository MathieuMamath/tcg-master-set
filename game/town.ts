import { APARTMENT_FROM_TOWN } from './apartment';
import { BEDROOM_FROM_TOWN } from './bedroom';
import type { Rect } from './collision';
import { LIBRARY_FROM_TOWN } from './library';
import { PARK_FROM_TOWN } from './park';
import { SHOP_FROM_TOWN } from './shop';
import type { Place, PlaceItem } from './world';

const TILE_SIZE = 3;
const GROUND_HEIGHT = 0.02 * TILE_SIZE;
const HALF_LENGTH = 13.5;

const HOUSE_X = -3.5;
const SHOP_X = 3.5;
const SHOP_DOOR_X = 2.9;
const BUILDINGS_Z = -3;

export const APARTMENT_X = -10;
export const LIBRARY_X = 10;
export const LIBRARY_FRONT_Z = -1.42;
export const PARK_SIGN = { x: 12.3, z: 0.1 };

// Stops the character from walking behind the buildings, out of sight.
const BOUNDS: Rect = { minX: -HALF_LENGTH, maxX: HALF_LENGTH, minZ: -1.4, maxZ: 3.5 };

const ROAD_COLUMNS = [-12, -9, -6, -3, 0, 3, 6, 9, 12];

const GROUND: PlaceItem[] = ROAD_COLUMNS.flatMap((x) => [
  { model: 'town/roads/road-straight' as const, x, z: 2, height: 0 },
  { model: 'town/roads/tile-low' as const, x, z: -1, height: 0 },
  { model: 'town/roads/tile-low' as const, x, z: -4, height: 0 },
]);

const BUILDINGS: PlaceItem[] = [
  { model: 'town/suburban/building-type-a', x: HOUSE_X, z: BUILDINGS_Z, blocksMovement: true },
  // This building's storefront is on its back, so it turns to face the street.
  {
    model: 'town/commercial/building-a',
    x: SHOP_X,
    z: BUILDINGS_Z,
    quarterTurns: 2,
    blocksMovement: true,
  },
  { model: 'town/commercial/detail-awning', x: SHOP_X + 0.5, z: -1.38, quarterTurns: 2 },
  // The same small model as the house, tinted differently for the grandmother's home.
  {
    model: 'town/suburban/building-type-a',
    x: APARTMENT_X,
    z: BUILDINGS_Z,
    blocksMovement: true,
    tint: '#f0b8c8',
  },
  // The same small model as the house, tinted so that it doesn't look like home.
  {
    model: 'town/suburban/building-type-a',
    x: LIBRARY_X,
    z: BUILDINGS_Z,
    blocksMovement: true,
    tint: '#e0a878',
  },
];

const DECOR: PlaceItem[] = [
  { model: 'town/suburban/tree-large', x: -13.1, z: -1, blocksMovement: true },
  { model: 'town/suburban/planter', x: -7.9, z: -1.25, blocksMovement: true },
  { model: 'town/suburban/tree-large', x: -6.6, z: -1, blocksMovement: true },
  { model: 'town/suburban/tree-small', x: 0, z: -1.25, blocksMovement: true },
  { model: 'town/suburban/tree-large', x: 6.6, z: -1, blocksMovement: true },
  { model: 'town/suburban/planter', x: 7.9, z: -1.25, blocksMovement: true },
  { model: 'town/suburban/tree-small', x: 12.4, z: -1.25, blocksMovement: true },
  { model: 'town/suburban/tree-large', x: 13.1, z: -1, blocksMovement: true },
  { model: 'town/suburban/planter', x: 1.4, z: -1.25, blocksMovement: true },
  // Its footprint is mostly the overhanging arm, so it doesn't block the pavement.
  { model: 'town/roads/light-square', x: -1.2, z: 0.3 },
];

export const TOWN: Place = {
  id: 'town',
  items: [...GROUND, ...BUILDINGS, ...DECOR],
  bounds: BOUNDS,
  exits: [
    {
      area: { minX: HOUSE_X - 0.5, maxX: HOUSE_X + 0.5, minZ: -1.4, maxZ: -1.05 },
      to: 'bedroom',
      arrival: BEDROOM_FROM_TOWN,
    },
    {
      area: { minX: SHOP_DOOR_X - 0.45, maxX: SHOP_DOOR_X + 0.45, minZ: -1.4, maxZ: -1.05 },
      to: 'shop',
      arrival: SHOP_FROM_TOWN,
    },
    {
      area: { minX: LIBRARY_X - 0.45, maxX: LIBRARY_X + 0.45, minZ: -1.4, maxZ: -1.05 },
      to: 'library',
      arrival: LIBRARY_FROM_TOWN,
    },
    {
      area: { minX: APARTMENT_X - 0.45, maxX: APARTMENT_X + 0.45, minZ: -1.4, maxZ: -1.05 },
      to: 'apartment',
      arrival: APARTMENT_FROM_TOWN,
    },
    // The road's far end leads out of town.
    {
      area: { minX: HALF_LENGTH - 0.45, maxX: HALF_LENGTH, minZ: 0.5, maxZ: 3.5 },
      to: 'park',
      arrival: PARK_FROM_TOWN,
    },
  ],
  exitMarkers: [
    { x: HOUSE_X, z: -1.2, quarterTurns: 0 },
    { x: SHOP_DOOR_X, z: -1.2, quarterTurns: 0 },
    { x: LIBRARY_X, z: -1.2, quarterTurns: 0 },
    { x: APARTMENT_X, z: -1.2, quarterTurns: 0 },
    { x: HALF_LENGTH - 0.5, z: 2, quarterTurns: 3 },
  ],
  npcs: [],
  groundHeight: GROUND_HEIGHT,
  cameraStart: { x: HOUSE_X, z: -0.35 },
  fitsOnScreen: false,
};
