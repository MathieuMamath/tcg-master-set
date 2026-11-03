export const BASKETBALL_QUEST = 'arcade-basketball';
export const BASKETBALL_GAME = 'basketball';
export const BASKETBALL_COINS = 100;
export const GAME_SECONDS = 30;
export const COINS_SCORE = 20;
export const BOOSTER_SCORE = 50;
// How long the ball takes to come back, before the next shot.
export const SHOT_GAP_MS = 500;

const GAME_MS = GAME_SECONDS * 1000;
// Room for the requests to travel, or for a hidden tab's slow timers.
const GRACE_SECONDS = 15;
const SHOT_LIMIT = Math.ceil(GAME_MS / SHOT_GAP_MS) + 1;

// Half the width of the meter's zones, around its centre at 0.5.
export const SWISH_ZONE = 0.05;
export const BASKET_ZONE = 0.15;

const FIRST_CROSSING_MS = 1000;
const FASTEST_CROSSING_MS = 500;
const CROSSING_SPEEDUP_MS = 20;

export type BasketballReward = 'none' | 'coins' | 'booster';

// The cursor crosses the meter faster with each shot, going back and forth from the left end.
export function cursorPosition(msSinceReady: number, shotIndex: number): number {
  if (msSinceReady <= 0) {
    return 0;
  }
  const crossing = Math.max(
    FIRST_CROSSING_MS - shotIndex * CROSSING_SPEEDUP_MS,
    FASTEST_CROSSING_MS,
  );
  const progress = (msSinceReady / crossing) % 2;
  return progress <= 1 ? progress : 2 - progress;
}

export function pointsAt(position: number): 0 | 2 | 3 {
  const distance = Math.abs(position - 0.5);
  return distance <= SWISH_ZONE ? 3 : distance <= BASKET_ZONE ? 2 : 0;
}

// When a shot can be taken after the previous one, which the cursor starts from.
export function readyAt(previousShotMs: number | undefined): number {
  return previousShotMs === undefined ? 0 : previousShotMs + SHOT_GAP_MS;
}

export function pointsOfShot(shotMs: number, previousShotMs: number | undefined, index: number) {
  return pointsAt(cursorPosition(shotMs - readyAt(previousShotMs), index));
}

// The browser only says when the ball left, so the server works out the score from the same rules.
// Null for shots that can't have happened. The request comes from the browser, so it can be anything.
export function scoreOfShots(shots: unknown): number | null {
  if (!Array.isArray(shots) || shots.length > SHOT_LIMIT) {
    return null;
  }
  let score = 0;
  let previous: number | undefined;
  for (const [index, shot] of shots.entries()) {
    if (!Number.isFinite(shot) || shot < readyAt(previous) || shot > GAME_MS) {
      return null;
    }
    score += pointsOfShot(shot, previous, index);
    previous = shot;
  }
  return score;
}

// The game lasts as long as it says: finishing early would mean the browser made it up.
export function canFinishBasketball(startedAt: Date, now: Date): boolean {
  const seconds = (now.getTime() - startedAt.getTime()) / 1000;
  return seconds >= GAME_SECONDS - 1 && seconds <= GAME_SECONDS + GRACE_SECONDS;
}

export function basketballReward(score: number): BasketballReward {
  return score >= BOOSTER_SCORE ? 'booster' : score >= COINS_SCORE ? 'coins' : 'none';
}
