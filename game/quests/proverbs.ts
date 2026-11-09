// Once beaten for the day, Papy Caillou no longer offers a game: he shares a saying instead, a
// different one each time the player comes to the park. The sayings themselves are in the messages,
// numbered from 1.
export const PROVERB_COUNT = 30;

export function pickProverb(random: () => number = Math.random): number {
  return Math.min(Math.floor(random() * PROVERB_COUNT), PROVERB_COUNT - 1) + 1;
}

// Never the same one twice in a row, so that coming back always brings a new one.
export function nextProverb(previous: number | null, random: () => number = Math.random): number {
  const picked = pickProverb(random);
  return picked === previous ? (picked % PROVERB_COUNT) + 1 : picked;
}
