import type { ShopkeeperStock } from '../cards/shop-dialogue';

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
  // Brutus, the bulldog who guards the administrative office, and Mme Hulotte, the owl who keeps it.
  | 'brutus'
  | 'hulotte'
  // Bastien, the beaver who keeps the office's archives and exports the card statistics.
  | 'archivist'
  // Mlle Trotte, the mouse who keeps the coupon floor, and the administrative office's lift.
  | 'trotte'
  | 'elevator'
  // Scrubbing the dust off a wall, during Léa's quest.
  | 'scrub'
  // Reading the bus stop's sign, which opens the map of the stops.
  | 'busStop'
  // Going to bed, which only sends Pip to sleep at night.
  | 'bed'
  // Opening the wardrobe in the bedroom, to put on a scarf the player has, and looking in its
  // standing mirror, to change the animal they walk about as.
  | 'wardrobe'
  | 'mirror'
  // The ramen shop downtown, and its chef, who hires the player for its three jobs.
  | 'enterRamen'
  | 'leaveRamen'
  | 'ramenChef'
  // The dojo downtown, and its master, who trains the player in slicing and archery.
  | 'enterDojo'
  | 'leaveDojo'
  | 'dojoMaster'
  // Pépin, the squirrel who tends Linden Park's garden, and has its lawn cleaned and beds watered.
  | 'gardener'
  // Gustave, the heron who keeps the village's post stand and has the mail sorted.
  | 'postman'
  // Pinceau, the sheep who paints by the park's lake and has his painting put back together.
  | 'painter'
  // Mme Ronron, the old cat by Léa's block whose kitten hides somewhere every day, and a hiding
  // place being searched for him.
  | 'ronron'
  | 'search'
  // Flash, the chameleon who photographs the big city's sky.
  | 'photographer'
  // Maison Éventail, the luxury boutique downtown: its door, Mlle Éventail the peahen who keeps it,
  // and its fitting room, where scarves are tried, bought and put on.
  | 'enterBoutique'
  | 'leaveBoutique'
  | 'boutiqueSeller'
  | 'fittingRoom';
