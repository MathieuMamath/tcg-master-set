import { moveWithCollisions, type Position, type Rect } from './collision';
import { type CharacterState, type Direction, stepCharacter } from './movement';
import type { ShopkeeperStock } from './shop-dialogue';

export const CHARACTER_RADIUS = 0.25;

const NPC_RADIUS = 0.25;

const FURNITURE_SCALE = 1.5;
const TOWN_SCALE = 3;

// Measured from the model files, before scaling: [width, depth].
const FOOTPRINTS = {
  'furniture/bear': [0.39, 0.247],
  'furniture/bedSingle': [0.571, 1.125],
  'furniture/bookcaseOpen': [0.4, 0.25],
  'furniture/cardboardBoxClosed': [0.212, 0.212],
  'furniture/cardboardBoxOpen': [0.372, 0.212],
  'furniture/chairDesk': [0.335, 0.314],
  'furniture/computerKeyboard': [0.282, 0.118],
  'furniture/computerMouse': [0.05, 0.085],
  'furniture/computerScreen': [0.393, 0.104],
  'furniture/desk': [0.734, 0.392],
  'furniture/floorFull': [1, 1],
  'furniture/kitchenBar': [0.43, 0.21],
  'furniture/lampRoundFloor': [0.152, 0.176],
  'furniture/pottedPlant': [0.212, 0.242],
  'furniture/rugRectangle': [1.57, 0.92],
  'furniture/rugSquare': [0.904, 0.92],
  'furniture/speaker': [0.148, 0.148],
  'furniture/tableCoffeeSquare': [0.4, 0.4],
  'furniture/wall': [1, 0.05],
  'furniture/wallDoorway': [1, 0.09],
  'furniture/wallWindow': [1, 0.09],
  'town/commercial/building-a': [0.884, 0.94],
  'town/commercial/detail-awning': [0.4, 0.148],
  'town/roads/light-square': [0.05, 0.238],
  'town/roads/road-straight': [1, 1],
  'town/roads/tile-low': [1, 1],
  'town/suburban/building-type-a': [1.3, 1.028],
  'town/suburban/planter': [0.4, 0.3],
  'town/suburban/tree-large': [0.21, 0.242],
  'town/suburban/tree-small': [0.21, 0.242],
} as const;

export type ModelName = keyof typeof FOOTPRINTS;

export const MODEL_NAMES = Object.keys(FOOTPRINTS) as ModelName[];

export const NPC_MODELS = ['character-female-b', 'character-male-c', 'character-female-d'] as const;

export type NpcModel = (typeof NPC_MODELS)[number];

export type PlaceId = 'bedroom' | 'town' | 'shop';

export type PlaceItem = {
  model: ModelName;
  x: number;
  z: number;
  height?: number;
  quarterTurns?: number;
  sizeFactor?: number;
  blocksMovement?: boolean;
  // Paints the whole model, for rooms with a look of their own.
  color?: string;
};

export type Arrival = Position & { heading: number };

export type Exit = {
  area: Rect;
  to: PlaceId;
  arrival: Arrival;
};

// An arrow on the ground. With no turn it points away from the camera.
export type ExitMarker = Position & { quarterTurns: number };

export type Npc = Position & {
  model: NpcModel;
  // What this NPC sells.
  stock: ShopkeeperStock;
  heading: number;
  // Where the player has to stand to talk to this NPC.
  talkArea: Rect;
};

export type Place = {
  id: PlaceId;
  items: readonly PlaceItem[];
  bounds: Rect;
  exits: readonly Exit[];
  exitMarkers: readonly ExitMarker[];
  npcs: readonly Npc[];
  binderArea?: Rect;
  groundHeight: number;
  cameraStart: Position;
  fitsOnScreen: boolean;
};

export function modelScale(model: ModelName): number {
  return model.startsWith('town/') ? TOWN_SCALE : FURNITURE_SCALE;
}

export function footprintOf(item: PlaceItem): Rect {
  const [width, depth] = FOOTPRINTS[item.model];
  const scale = modelScale(item.model) * (item.sizeFactor ?? 1);
  const isSideways = (item.quarterTurns ?? 0) % 2 === 1;
  const halfX = ((isSideways ? depth : width) * scale) / 2;
  const halfZ = ((isSideways ? width : depth) * scale) / 2;

  return {
    minX: item.x - halfX,
    maxX: item.x + halfX,
    minZ: item.z - halfZ,
    maxZ: item.z + halfZ,
  };
}

export function obstaclesOf(place: Place): Rect[] {
  const furniture = place.items.filter((item) => item.blocksMovement).map(footprintOf);
  const npcs = place.npcs.map(({ x, z }) => ({
    minX: x - NPC_RADIUS,
    maxX: x + NPC_RADIUS,
    minZ: z - NPC_RADIUS,
    maxZ: z + NPC_RADIUS,
  }));

  return [...furniture, ...npcs];
}

export function stepInPlace(
  place: Place,
  state: CharacterState,
  direction: Direction,
  delta: number,
): CharacterState {
  const next = stepCharacter(state, direction, delta);
  const position = moveWithCollisions(
    state,
    next,
    obstaclesOf(place),
    place.bounds,
    CHARACTER_RADIUS,
  );

  return { ...next, ...position };
}

export function exitAt(place: Place, position: Position): Exit | undefined {
  return place.exits.find(({ area }) => isInside(position, area));
}

export function npcInReach(place: Place, position: Position): Npc | undefined {
  return place.npcs.find(({ talkArea }) => isInside(position, talkArea));
}

export type Interaction = ShopkeeperStock | 'binder';

export function interactionAt(place: Place, position: Position): Interaction | null {
  const npc = npcInReach(place, position);
  if (npc) {
    return npc.stock;
  }
  return place.binderArea && isInside(position, place.binderArea) ? 'binder' : null;
}

export function isInside(position: Position, area: Rect): boolean {
  return (
    position.x >= area.minX &&
    position.x <= area.maxX &&
    position.z >= area.minZ &&
    position.z <= area.maxZ
  );
}
