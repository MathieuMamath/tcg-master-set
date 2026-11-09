const CHARACTERS_PER_SECOND = 45;

export function revealedLength(elapsedMilliseconds: number, textLength: number): number {
  const revealed = Math.floor((elapsedMilliseconds / 1000) * CHARACTERS_PER_SECOND);
  return Math.min(Math.max(revealed, 0), textLength);
}
