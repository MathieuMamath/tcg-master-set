// The sky seen through windows. It will change with the time of day and the weather, and is always
// a clear morning for now.
export type TimeOfDay = 'day';
export type Weather = 'fewClouds';

export type SkyLook = {
  top: string;
  horizon: string;
  cloud: string;
  cloudCount: number;
  // How fast the clouds drift, in skies per second.
  drift: number;
};

const LOOKS: Record<TimeOfDay, Record<Weather, SkyLook>> = {
  day: {
    fewClouds: {
      top: '#6fb3e6',
      horizon: '#cfe8f5',
      cloud: '#ffffff',
      cloudCount: 4,
      drift: 0.006,
    },
  },
};

export function skyLook(time: TimeOfDay, weather: Weather): SkyLook {
  return LOOKS[time][weather];
}
