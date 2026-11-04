import { describe, expect, test } from 'vitest';
import {
  ballNumber,
  drawRaffle,
  JACKPOT_CHANCE,
  JACKPOT_COINS,
  PRIZE_CHANCE,
  PRIZE_COINS,
  RAFFLE_COINS,
} from './raffle';

describe('drawRaffle', () => {
  test('three draws in a hundred win the jackpot', () => {
    expect(JACKPOT_CHANCE).toBe(0.03);
    expect(drawRaffle(() => 0)).toBe('jackpot');
    expect(drawRaffle(() => 0.0299)).toBe('jackpot');
  });

  test('ten draws in a hundred win the prize', () => {
    expect(PRIZE_CHANCE).toBe(0.1);
    expect(drawRaffle(() => 0.03)).toBe('prize');
    expect(drawRaffle(() => 0.1299)).toBe('prize');
  });

  test('the others win nothing', () => {
    expect(drawRaffle(() => 0.13)).toBe('none');
    expect(drawRaffle(() => 0.9999)).toBe('none');
  });

  test('pays what each ball is worth', () => {
    expect(RAFFLE_COINS).toEqual({ jackpot: JACKPOT_COINS, prize: PRIZE_COINS, none: 0 });
    expect(JACKPOT_COINS).toBe(3000);
    expect(PRIZE_COINS).toBe(300);
  });
});

test('the ball is numbered from 1 to 99', () => {
  expect(ballNumber(() => 0)).toBe(1);
  expect(ballNumber(() => 0.9999)).toBe(99);
});
