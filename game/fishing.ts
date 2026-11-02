export const FISHING_QUEST = 'boy-fishing';
export const FISH_COINS = 50;
export const SHINY_CHANCE = 1 / 5;

const MIN_BITE_SECONDS = 1.5;
const MAX_BITE_SECONDS = 4;

export type Fish = 'common' | 'shiny';

export function catchFish(random: () => number = Math.random): Fish {
  return random() < SHINY_CHANCE ? 'shiny' : 'common';
}

// Only for show: the fish is drawn when it is reeled in, so that waiting changes nothing.
export function secondsUntilBite(random: () => number = Math.random): number {
  return MIN_BITE_SECONDS + random() * (MAX_BITE_SECONDS - MIN_BITE_SECONDS);
}
