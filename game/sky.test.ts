import { expect, test } from 'vitest';
import { skyLook } from './sky';

test('a day with a few clouds is a bright blue sky with some clouds drifting', () => {
  const look = skyLook('day', 'fewClouds');

  expect(look.cloudCount).toBeGreaterThan(0);
  expect(look.drift).toBeGreaterThan(0);
  expect(look.top).toMatch(/^#[0-9a-f]{6}$/);
});
