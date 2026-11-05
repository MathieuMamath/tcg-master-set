import type { ShopkeeperStock } from './shop-dialogue';

// Who gives a quest: Léa, Papy Caillou and Lucas, under the ids they had in the old town, as
// players' progress is stored under them, then Gaspard and Bérénice.
export type QuestGiver = 'grandma' | 'grandpa' | 'boy' | 'gaspard' | 'berenice';

// Everything the character can do where it stands, from talking to going through a door.
export type Interaction =
  | ShopkeeperStock
  | 'binderSeller'
  | QuestGiver
  | 'binder'
  | 'basketball'
  | 'leaveHome'
  | 'goHome'
  | 'enterShop'
  | 'leaveShop'
  | 'enterBookshop'
  | 'leaveBookshop'
  | 'enterFlat'
  | 'leaveFlat'
  | 'enterArcade'
  | 'leaveArcade'
  | 'leaveBureau'
  // Brutus, the bulldog who guards the statistics bureau, and Mme Hulotte, the owl who keeps it.
  | 'brutus'
  | 'hulotte'
  // Scrubbing the dust off a wall, during Léa's quest.
  | 'scrub'
  // Reading the bus stop's sign, which opens the map of the stops.
  | 'busStop';
