// Bérénice's raffle, at her stand in the street: one free turn of the drum a day. Most balls are
// white and win nothing, a red one pays a small prize, and a gold one the jackpot.
export const RAFFLE_QUEST = 'raffle';

export const JACKPOT_CHANCE = 0.03;
export const PRIZE_CHANCE = 0.1;
export const JACKPOT_COINS = 3000;
export const PRIZE_COINS = 300;

export type RaffleOutcome = 'jackpot' | 'prize' | 'none';

export const RAFFLE_COINS: Record<RaffleOutcome, number> = {
  jackpot: JACKPOT_COINS,
  prize: PRIZE_COINS,
  none: 0,
};

// The balls go up to this number, only for show.
const BALL_COUNT = 99;

// A single roll: the jackpot's share first, then the prize's.
export function drawRaffle(random: () => number = Math.random): RaffleOutcome {
  const roll = random();
  if (roll < JACKPOT_CHANCE) {
    return 'jackpot';
  }
  return roll < JACKPOT_CHANCE + PRIZE_CHANCE ? 'prize' : 'none';
}

// The number painted on the ball that comes out, which changes nothing.
export function ballNumber(random: () => number = Math.random): number {
  return 1 + Math.min(Math.floor(random() * BALL_COUNT), BALL_COUNT - 1);
}
