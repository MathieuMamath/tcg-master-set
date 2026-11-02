import { describe, expect, test } from 'vitest';
import { catchFish, SHINY_CHANCE, secondsUntilBite } from './fishing';

describe('catchFish', () => {
  test('one fish in five is shiny', () => {
    expect(SHINY_CHANCE).toBe(0.2);
  });

  test.each([
    [0, 'shiny'],
    [0.19, 'shiny'],
    [0.2, 'common'],
    [0.99, 'common'],
  ])('a roll of %d catches a %s fish', (roll, fish) => {
    expect(catchFish(() => roll)).toBe(fish);
  });
});

describe('secondsUntilBite', () => {
  test('always leaves a short wait, but never a long one', () => {
    expect(secondsUntilBite(() => 0)).toBe(1.5);
    expect(secondsUntilBite(() => 0.999)).toBeLessThan(4);
  });
});
