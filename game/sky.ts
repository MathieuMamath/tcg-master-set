import { MINUTES_PER_DAY, type TimeOfDay, type Weather } from './clock';

export type { TimeOfDay, Weather };

// The sky, outside and through windows, by the time of day and the weather.
export type SkyLook = {
  top: string;
  horizon: string;
  cloud: string;
  cloudCount: number;
  // How fast the clouds drift, in skies per second.
  drift: number;
  // Stars show on a clear or cloudy night.
  stars: boolean;
};

// How the world outside is dimmed: a colour laid over it, multiplied, at this strength.
export type WorldTint = { color: string; strength: number };

const TIMES: Record<TimeOfDay, { top: string; horizon: string; cloud: string }> = {
  dawn: { top: '#7a8fc9', horizon: '#f6c49a', cloud: '#fde3d3' },
  day: { top: '#6fb3e6', horizon: '#cfe8f5', cloud: '#ffffff' },
  dusk: { top: '#4a5a9e', horizon: '#f19a6b', cloud: '#f7c6b0' },
  // Lighter than a real night sky, as the night's tint darkens it again outside.
  night: { top: '#1c2c60', horizon: '#3f5594', cloud: '#55658f' },
};

// How grey each weather turns the sky, and its clouds.
const WEATHERS: Record<
  Weather,
  { grey: string; greyness: number; cloudCount: number; drift: number }
> = {
  fewClouds: { grey: '#8b95a3', greyness: 0, cloudCount: 4, drift: 0.006 },
  cloudy: { grey: '#8b95a3', greyness: 0.35, cloudCount: 7, drift: 0.008 },
  rain: { grey: '#7c8694', greyness: 0.55, cloudCount: 8, drift: 0.01 },
  storm: { grey: '#565e6c', greyness: 0.7, cloudCount: 9, drift: 0.016 },
  snow: { grey: '#c3cad4', greyness: 0.45, cloudCount: 7, drift: 0.004 },
};

const TIME_TINTS: Record<TimeOfDay, WorldTint> = {
  dawn: { color: '#e9a07a', strength: 0.14 },
  day: { color: '#ffffff', strength: 0 },
  dusk: { color: '#c86a4a', strength: 0.22 },
  night: { color: '#1c2a5a', strength: 0.5 },
};
const WEATHER_DIMMING: Record<Weather, number> = {
  fewClouds: 0,
  cloudy: 0.06,
  rain: 0.14,
  storm: 0.24,
  snow: 0.05,
};

function channels(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

// A colour the given share of the way from one to the other.
export function mixColors(from: string, to: string, share: number): string {
  const start = channels(from);
  const end = channels(to);
  return `#${start
    .map((channel, index) =>
      Math.round(channel + ((end[index] ?? channel) - channel) * share)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

export function skyLook(time: TimeOfDay, weather: Weather): SkyLook {
  const base = TIMES[time];
  const { grey, greyness, cloudCount, drift } = WEATHERS[weather];
  // At night the clouds only darken what is already dark.
  const share = time === 'night' ? greyness * 0.4 : greyness;
  return {
    top: mixColors(base.top, grey, share),
    horizon: mixColors(base.horizon, grey, share),
    cloud: mixColors(base.cloud, grey, share * 0.6),
    cloudCount,
    drift,
    stars: time === 'night' && (weather === 'fewClouds' || weather === 'cloudy'),
  };
}

// Outside, the world darkens at night and turns warm at dawn and dusk, and the rain dims it.
export function worldTint(time: TimeOfDay, weather: Weather): WorldTint {
  const { color, strength } = TIME_TINTS[time];
  const dimming = WEATHER_DIMMING[weather];
  if (dimming === 0) {
    return { color, strength };
  }
  return {
    color: strength === 0 ? '#5a6272' : mixColors(color, '#5a6272', dimming),
    strength: Math.min(0.65, strength + dimming),
  };
}

const LAMP_LIGHT: Record<TimeOfDay, number> = { dawn: 0.35, day: 0, dusk: 0.75, night: 1 };

// How brightly the street lamps shine, from 0 when they are off to 1: from dusk until dawn, and
// on a stormy day too.
export function lampLight(time: TimeOfDay, weather: Weather): number {
  const light = LAMP_LIGHT[time];
  return weather === 'storm' ? Math.max(light, 0.6) : light;
}

// The sky and the light move smoothly through the day: between these moments, each the heart of a
// time of day, they blend from one look to the next, a little more every game minute.
const DAY_MOMENTS: readonly [number, TimeOfDay][] = [
  [0, 'night'],
  [4 * 60 + 30, 'night'],
  [6 * 60, 'dawn'],
  [7 * 60 + 30, 'day'],
  [17 * 60, 'day'],
  [19 * 60, 'dusk'],
  [21 * 60, 'night'],
  [MINUTES_PER_DAY, 'night'],
];

// The two looks a minute falls between, and how far it is from the first to the second.
function momentsAround(minute: number): { from: TimeOfDay; to: TimeOfDay; share: number } {
  const wrapped = ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  for (let index = 1; index < DAY_MOMENTS.length; index++) {
    const [end, to] = DAY_MOMENTS[index] ?? [MINUTES_PER_DAY, 'night'];
    const [start, from] = DAY_MOMENTS[index - 1] ?? [0, 'night'];
    if (wrapped <= end) {
      return { from, to, share: end === start ? 0 : (wrapped - start) / (end - start) };
    }
  }
  return { from: 'night', to: 'night', share: 0 };
}

// The sky's colours at a minute of the game's day, and how bright its stars are, from 0 to 1.
export type SkyColors = { top: string; horizon: string; cloud: string; stars: number };

export function skyAt(minute: number, weather: Weather): SkyColors {
  const { from, to, share } = momentsAround(minute);
  const start = skyLook(from, weather);
  const end = skyLook(to, weather);
  return {
    top: mixColors(start.top, end.top, share),
    horizon: mixColors(start.horizon, end.horizon, share),
    cloud: mixColors(start.cloud, end.cloud, share),
    stars: (start.stars ? 1 : 0) + ((end.stars ? 1 : 0) - (start.stars ? 1 : 0)) * share,
  };
}

export function worldTintAt(minute: number, weather: Weather): WorldTint {
  const { from, to, share } = momentsAround(minute);
  const start = worldTint(from, weather);
  const end = worldTint(to, weather);
  return {
    color: mixColors(start.color, end.color, share),
    strength: start.strength + (end.strength - start.strength) * share,
  };
}

export function lampLightAt(minute: number, weather: Weather): number {
  const { from, to, share } = momentsAround(minute);
  const start = lampLight(from, weather);
  return start + (lampLight(to, weather) - start) * share;
}
