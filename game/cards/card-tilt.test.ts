import { expect, test } from 'vitest';
import { cardTilt, MAX_TILT_DEGREES } from './card-tilt';

const AREA = { left: 100, top: 200, width: 400, height: 600 };

test('stays flat with the pointer in the middle', () => {
  const { rotateX, rotateY } = cardTilt(300, 500, AREA);

  expect(rotateX).toBeCloseTo(0);
  expect(rotateY).toBeCloseTo(0);
});

test('leans the side under the pointer away from the player', () => {
  expect(cardTilt(500, 500, AREA).rotateY).toBeCloseTo(MAX_TILT_DEGREES);
  expect(cardTilt(100, 500, AREA).rotateY).toBeCloseTo(-MAX_TILT_DEGREES);
  expect(cardTilt(300, 200, AREA).rotateX).toBeCloseTo(MAX_TILT_DEGREES);
  expect(cardTilt(300, 800, AREA).rotateX).toBeCloseTo(-MAX_TILT_DEGREES);
});

test('never goes past the limit, even with the pointer outside the card', () => {
  const { rotateX, rotateY } = cardTilt(5000, -5000, AREA);

  expect(rotateX).toBeCloseTo(MAX_TILT_DEGREES);
  expect(rotateY).toBeCloseTo(MAX_TILT_DEGREES);
});
