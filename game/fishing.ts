// Lucas, the little otter at the park's lake, has dropped his things in the water, and the player
// fishes them out for him. Most are everyday things, paid in coins, but one time in five the line
// brings up his treasure box, with a booster inside. The quest keeps the id it had when it was a
// fish, because players' progress is stored under it.
export const FISHING_QUEST = 'boy-fishing';
export const ITEM_COINS = 50;
export const TREASURE_CHANCE = 1 / 5;

export const EVERYDAY_ITEMS = ['boat', 'sandal', 'ball', 'duck'] as const;

export type FishedItem = (typeof EVERYDAY_ITEMS)[number] | 'treasure';

const MIN_BITE_SECONDS = 1.5;
const MAX_BITE_SECONDS = 4;

// The first roll decides between the treasure and the rest, and the second which everyday thing.
export function fishItem(random: () => number = Math.random): FishedItem {
  if (random() < TREASURE_CHANCE) {
    return 'treasure';
  }
  return EVERYDAY_ITEMS[
    Math.min(Math.floor(random() * EVERYDAY_ITEMS.length), EVERYDAY_ITEMS.length - 1)
  ];
}

// Only for show: the item is drawn when the line comes up, so that waiting changes nothing.
export function secondsUntilBite(random: () => number = Math.random): number {
  return MIN_BITE_SECONDS + random() * (MAX_BITE_SECONDS - MIN_BITE_SECONDS);
}
