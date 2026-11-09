import { describe, expect, it } from 'vitest';
import { lampLight, lampLightAt, mixColors, skyAt, skyLook, worldTint, worldTintAt } from './sky';

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

describe('skyAt', () => {
  it('matches each time of day at its heart', () => {
    const noon = skyAt(12 * 60, 'fewClouds');
    expect(noon.top).toBe(skyLook('day', 'fewClouds').top);
    expect(skyAt(23 * 60, 'fewClouds').top).toBe(skyLook('night', 'fewClouds').top);
    expect(skyAt(19 * 60, 'fewClouds').horizon).toBe(skyLook('dusk', 'fewClouds').horizon);
  });

  it('blends between them, so that a game minute only moves the sky a little', () => {
    const halfway = skyAt(18 * 60, 'fewClouds');
    expect(halfway.top).not.toBe(skyLook('day', 'fewClouds').top);
    expect(halfway.top).not.toBe(skyLook('dusk', 'fewClouds').top);
    for (let minute = 0; minute < 24 * 60; minute += 1) {
      const now = Number.parseInt(skyAt(minute, 'rain').top.slice(1), 16);
      const next = Number.parseInt(skyAt(minute + 1, 'rain').top.slice(1), 16);
      const channel = (value: number, shift: number) => (value >> shift) & 255;
      for (const shift of [0, 8, 16]) {
        expect(Math.abs(channel(now, shift) - channel(next, shift))).toBeLessThanOrEqual(4);
      }
    }
  });

  it('brings the stars out slowly at dusk', () => {
    expect(skyAt(12 * 60, 'fewClouds').stars).toBe(0);
    expect(skyAt(20 * 60, 'fewClouds').stars).toBeGreaterThan(0);
    expect(skyAt(20 * 60, 'fewClouds').stars).toBeLessThan(1);
    expect(skyAt(23 * 60, 'fewClouds').stars).toBe(1);
  });
});

describe('worldTintAt and lampLightAt', () => {
  it('darken the world and light the lamps gradually through the evening', () => {
    const evening = [17, 18, 19, 20, 21].map((hour) => worldTintAt(hour * 60, 'fewClouds'));
    expect(evening[0]?.strength).toBe(0);
    expect(evening[4]?.strength).toBe(worldTint('night', 'fewClouds').strength);
    const lamps = [17, 18, 19, 20, 21].map((hour) => lampLightAt(hour * 60, 'fewClouds'));
    expect(lamps).toEqual([...lamps].sort((first, second) => first - second));
    expect(lamps[0]).toBe(0);
    expect(lamps[4]).toBe(lampLight('night', 'fewClouds'));
  });
});
