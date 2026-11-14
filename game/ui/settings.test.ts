import { expect, test } from 'vitest';
import { DEFAULT_SETTINGS, parseSettingsChange } from './settings';

test('plays the pull effects unless the player turns them off', () => {
  expect(DEFAULT_SETTINGS.pullEffects).toBe(true);
});

test('takes a change of the pull effects', () => {
  expect(parseSettingsChange({ pullEffects: false })).toEqual({ pullEffects: false });
  expect(parseSettingsChange({ pullEffects: true })).toEqual({ pullEffects: true });
});

test('refuses anything else', () => {
  for (const value of [null, 'off', {}, { pullEffects: 'no' }, { pullEffects: 0 }]) {
    expect(parseSettingsChange(value)).toBeNull();
  }
});
