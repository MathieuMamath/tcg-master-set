const MIN_MILLISECONDS = 350;
const MILLISECONDS_PER_DIGIT = 250;
const MAX_MILLISECONDS = 1200;

// A bigger change rolls for longer, though never long enough to keep the player waiting.
export function countDuration(from: number, to: number): number {
  const digits = String(Math.abs(to - from)).length;
  return Math.min(MIN_MILLISECONDS + (digits - 1) * MILLISECONDS_PER_DIGIT, MAX_MILLISECONDS);
}

// Fast at first, then slowing down onto the final number.
export function countAt(from: number, to: number, progress: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const eased = 1 - (1 - clamped) ** 3;
  return Math.round(from + (to - from) * eased);
}
