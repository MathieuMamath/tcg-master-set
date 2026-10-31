import { BEDROOM } from './bedroom';
import { SHOP } from './shop';
import { TOWN } from './town';
import type { Place, PlaceId } from './world';

export const PLACES: Record<PlaceId, Place> = { bedroom: BEDROOM, town: TOWN, shop: SHOP };
