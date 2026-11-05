import { describe, expect, it } from 'vitest';
import { lampLight, mixColors, skyLook, worldTint } from './sky';

describe('mixColors', () => {
  it('goes from one colour to the other', () => {
    expect(mixColors('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixColors('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixColors('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});

describe('skyLook', () => {
  it('keeps the clear morning sky the game always had', () => {
    expect(skyLook('day', 'fewClouds')).toEqual({
      top: '#6fb3e6',
      horizon: '#cfe8f5',
      cloud: '#ffffff',
      cloudCount: 4,
      drift: 0.006,
      stars: false,
    });
  });

  it('shows stars on a clear night, never through rain', () => {
    expect(skyLook('night', 'fewClouds').stars).toBe(true);
    expect(skyLook('night', 'rain').stars).toBe(false);
    expect(skyLook('day', 'fewClouds').stars).toBe(false);
  });

  it('greys the sky and adds clouds in bad weather', () => {
    const fair = skyLook('day', 'fewClouds');
    const storm = skyLook('day', 'storm');
    expect(storm.top).not.toBe(fair.top);
    expect(storm.cloudCount).toBeGreaterThan(fair.cloudCount);
  });
});

describe('worldTint', () => {
  it('leaves a fair day untouched and darkens the night', () => {
    expect(worldTint('day', 'fewClouds').strength).toBe(0);
    expect(worldTint('night', 'fewClouds').strength).toBeGreaterThan(0.3);
  });

  it('dims the world in the rain, without ever blacking it out', () => {
    expect(worldTint('day', 'rain').strength).toBeGreaterThan(0);
    expect(worldTint('night', 'storm').strength).toBeLessThanOrEqual(0.65);
  });
});

describe('lampLight', () => {
  it('lights the lamps from dusk until dawn, brightest at night', () => {
    expect(lampLight('day', 'fewClouds')).toBe(0);
    expect(lampLight('dusk', 'fewClouds')).toBeGreaterThan(0);
    expect(lampLight('night', 'fewClouds')).toBe(1);
    expect(lampLight('dawn', 'fewClouds')).toBeLessThan(lampLight('dusk', 'fewClouds'));
  });

  it('lights them on a stormy day', () => {
    expect(lampLight('day', 'storm')).toBeGreaterThan(0);
    expect(lampLight('night', 'storm')).toBe(1);
  });
});
