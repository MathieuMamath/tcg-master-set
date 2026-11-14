import { describe, expect, it } from 'vitest';
import { AVATAR_SPECIES, DEFAULT_SPECIES, isAvatarSpecies, parseAvatarChange } from './species';

describe('avatar species', () => {
  it('starts everyone as the fox', () => {
    expect(DEFAULT_SPECIES).toBe('fox');
    expect(AVATAR_SPECIES).toContain(DEFAULT_SPECIES);
  });

  it('knows its animals only', () => {
    expect(isAvatarSpecies('turtle')).toBe(true);
    expect(isAvatarSpecies('dragon')).toBe(false);
    expect(isAvatarSpecies(undefined)).toBe(false);
  });

  it('accepts a change to a known animal', () => {
    expect(parseAvatarChange({ species: 'rabbit' })).toBe('rabbit');
  });

  it('refuses anything else', () => {
    expect(parseAvatarChange(null)).toBeNull();
    expect(parseAvatarChange('rabbit')).toBeNull();
    expect(parseAvatarChange({ species: 'unicorn' })).toBeNull();
    expect(parseAvatarChange({})).toBeNull();
  });
});
