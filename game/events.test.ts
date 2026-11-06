import { expect, test } from 'vitest';
import { GAME_EVENT_TYPES, type GameEventDetails, isGameEventType } from './events';

test('lists every type of the catalogue once', () => {
  const catalogue: Record<keyof GameEventDetails, true> = {
    'player.signed_up': true,
    'player.signed_in': true,
    'binder.bought': true,
    'booster.bought': true,
    'booster.opened': true,
    'quest.started': true,
    'quest.finished': true,
    'quest.rejected': true,
    'daily_bonus.claimed': true,
    'place.entered': true,
    'game.opened': true,
    'game.left': true,
  };

  expect([...GAME_EVENT_TYPES].sort()).toEqual(Object.keys(catalogue).sort());
  expect(new Set(GAME_EVENT_TYPES).size).toBe(GAME_EVENT_TYPES.length);
});

test('names each type as a thing, then what happened to it', () => {
  for (const type of GAME_EVENT_TYPES) {
    expect(type).toMatch(/^[a-z_]+\.[a-z_]+$/);
  }
});

test('recognises the types of the catalogue only', () => {
  expect(isGameEventType('booster.opened')).toBe(true);
  expect(isGameEventType('booster.stolen')).toBe(false);
});
