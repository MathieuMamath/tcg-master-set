// The game's own clock, faster than the real one: one real second is one game minute, so a whole
// day passes in 24 real minutes. Every player shares it, shifted by how far their sleeps moved it
// on. The time and the weather are only for show: nothing that pays depends on them, and the
// daily quests keep following the real date.

export const MINUTES_PER_DAY = 24 * 60;

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type Weather = 'fewClouds' | 'cloudy' | 'rain' | 'storm' | 'snow';

const DAWN = 5 * 60;
const DAY = 7 * 60;
const DUSK = 18 * 60;
const NIGHT = 21 * 60;
// Pip can go to bed from eight in the evening until dawn, and wakes up at seven.
const BEDTIME = 20 * 60;
export const WAKE_UP = DAY;
// The weather holds for four game hours, four real minutes.
const WEATHER_SPELL = 4 * 60;

// The game minutes since the clock started, for a player whose sleeps moved it on by `offset`.
function gameMinutes(now: Date, offset: number): number {
  return Math.floor(now.getTime() / 1000) + offset;
}

// The minute of the game's day, from 0 at midnight to 1439.
export function minuteOfDay(now: Date, offset: number): number {
  const minutes = gameMinutes(now, offset) % MINUTES_PER_DAY;
  return minutes < 0 ? minutes + MINUTES_PER_DAY : minutes;
}

export function timeOfDay(minute: number): TimeOfDay {
  if (minute >= NIGHT || minute < DAWN) {
    return 'night';
  }
  if (minute < DAY) {
    return 'dawn';
  }
  return minute < DUSK ? 'day' : 'dusk';
}

export function canSleep(minute: number): boolean {
  return minute >= BEDTIME || minute < DAWN;
}

// The offset after a night's sleep: the clock moves on to seven in the morning. Kept within a day,
// as only the time of day matters.
export function offsetAfterSleep(now: Date, offset: number): number {
  const ahead = (WAKE_UP - minuteOfDay(now, offset) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return (((offset + ahead) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function isValidOffset(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < MINUTES_PER_DAY;
}

// A number from 0 to 1 that only depends on the spell, so that a spell's weather stays the same
// on every page and every reload.
function spellRoll(spell: number): number {
  let state = (spell * 0x9e3779b1) | 0;
  state = Math.imul(state ^ (state >>> 16), 0x85ebca6b);
  state = Math.imul(state ^ (state >>> 13), 0xc2b2ae35);
  state ^= state >>> 16;
  return (state >>> 0) / 4294967296;
}

// Snow only falls in winter, from December to February by the real date. Otherwise it rains, and
// now and then storms.
const SEASON_WEATHER: Record<'winter' | 'otherwise', [Weather, number][]> = {
  winter: [
    ['fewClouds', 0.45],
    ['cloudy', 0.25],
    ['snow', 0.3],
  ],
  otherwise: [
    ['fewClouds', 0.5],
    ['cloudy', 0.25],
    ['rain', 0.18],
    ['storm', 0.07],
  ],
};

export function isWinter(now: Date): boolean {
  const month = now.getUTCMonth();
  return month === 11 || month <= 1;
}

export function weatherAt(now: Date, offset: number): Weather {
  const spell = Math.floor(gameMinutes(now, offset) / WEATHER_SPELL);
  const roll = spellRoll(spell);
  let total = 0;
  for (const [weather, share] of SEASON_WEATHER[isWinter(now) ? 'winter' : 'otherwise']) {
    total += share;
    if (roll < total) {
      return weather;
    }
  }
  return 'fewClouds';
}

// The clock as it reads, such as 07:05.
export function clockReading(minute: number): { hours: number; minutes: number } {
  return { hours: Math.floor(minute / 60), minutes: minute % 60 };
}
