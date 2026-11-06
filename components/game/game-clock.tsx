'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  canSleep,
  clockReading,
  minuteOfDay,
  type TimeOfDay,
  timeOfDay,
  type Weather,
  weatherAt,
} from '@/game/clock';

export type GameClock = { time: TimeOfDay; weather: Weather; canSleep: boolean };

function readClock(offset: number): GameClock {
  const now = new Date();
  const minute = minuteOfDay(now, offset);
  return { time: timeOfDay(minute), weather: weatherAt(now, offset), canSleep: canSleep(minute) };
}

// The game's time and weather, checked every second, and only changed when they move on, so that
// the game isn't drawn again every game minute. Null until the page is in the browser, as the
// server's clock and the browser's needn't agree.
export function useGameClock(offset: number): GameClock | null {
  const [clock, setClock] = useState<GameClock | null>(null);
  useEffect(() => {
    const check = () =>
      setClock((previous) => {
        const next = readClock(offset);
        return previous &&
          previous.time === next.time &&
          previous.weather === next.weather &&
          previous.canSleep === next.canSleep
          ? previous
          : next;
      });
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [offset]);
  return clock;
}

function WeatherIcon({ time, weather }: { time: TimeOfDay; weather: Weather }) {
  const isNight = time === 'night';
  const cloud = (
    <path
      d="M6.5 17.5a3.5 3.5 0 0 1-.4-7 5 5 0 0 1 9.6-1.2A3.8 3.8 0 0 1 17.5 17.5z"
      fill="currentColor"
    />
  );
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
      {weather === 'fewClouds' &&
        (isNight ? (
          <path d="M15 3a8 8 0 1 0 6 13A7 7 0 0 1 15 3z" fill="currentColor" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4.5" fill="var(--ui-accent-dark)" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <path
                key={angle}
                d="M12 2v3"
                stroke="var(--ui-accent-dark)"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${angle} 12 12)`}
              />
            ))}
          </>
        ))}
      {weather === 'cloudy' && cloud}
      {weather === 'rain' && (
        <>
          <g transform="translate(0 -3)">{cloud}</g>
          {[8, 12, 16].map((dropX) => (
            <path
              key={dropX}
              d={`M${dropX} 17l-1 3`}
              stroke="#3a86c8"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}
        </>
      )}
      {weather === 'storm' && (
        <>
          <g transform="translate(0 -3)">{cloud}</g>
          <path d="M12.5 14l-3 5h2.5l-1 4 4-6h-2.5l1.5-3z" fill="var(--ui-accent-dark)" />
        </>
      )}
      {weather === 'snow' &&
        [0, 60, 120].map((angle) => (
          <path
            key={angle}
            d="M12 3v18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} 12 12)`}
          />
        ))}
    </svg>
  );
}

// The clock in the corner: the game's time, ticking one minute a second, and its weather.
export function ClockBadge({ offset, clock }: { offset: number; clock: GameClock }) {
  const t = useTranslations('Clock');
  const [minute, setMinute] = useState(() => minuteOfDay(new Date(), offset));
  useEffect(() => {
    const tick = () => setMinute(minuteOfDay(new Date(), offset));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [offset]);
  const { hours, minutes } = clockReading(minute);
  const reading = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return (
    <p className="flex rotate-1 items-center gap-1.5 ui-scrap px-3 py-1 font-digits text-base font-bold">
      <WeatherIcon time={clock.time} weather={clock.weather} />
      <span aria-hidden="true">{reading}</span>
      <span className="sr-only">
        {t('label', { time: reading, weather: t(`weather.${clock.weather}`) })}
      </span>
    </p>
  );
}

type Drop = { x: number; y: number; speed: number; size: number; sway: number; isSnow: boolean };

// How long a shower takes to build up once the weather turns.
const WEATHER_RAMP_SECONDS = 6;

const DROP_COUNTS: Partial<Record<Weather, number>> = { rain: 140, storm: 220, snow: 110 };

// Outside: rain or snow falling in front of the world, and lightning now and then in a storm.
// Drawn over the scene, under the menus. The light of the time of day is the scene's own.
export function WeatherLayer({ clock, isOutside }: { clock: GameClock; isOutside: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [flash, setFlash] = useState(false);
  const { weather } = clock;
  // Read by the drawing loop, which outlives a change of weather so that rain or snow comes and
  // goes gradually rather than all at once.
  const target = useRef({ count: 0, isSnow: false });
  target.current = { count: DROP_COUNTS[weather] ?? 0, isSnow: weather === 'snow' };

  // Restarted on each place outside, which starts with the weather already falling.
  useEffect(() => {
    const element = canvas.current;
    const drawing = element?.getContext('2d');
    if (!element || !drawing || !isOutside) {
      return;
    }
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wanted = () => (calm ? Math.round(target.current.count / 3) : target.current.count);
    const spawn = (y: number): Drop => {
      const isSnow = target.current.isSnow;
      return {
        x: Math.random() * element.width,
        y,
        speed: isSnow ? 40 + Math.random() * 50 : 700 + Math.random() * 400,
        size: isSnow ? 2 + Math.random() * 3 : 12 + Math.random() * 10,
        sway: Math.random() * Math.PI * 2,
        isSnow,
      };
    };
    const resize = () => {
      element.width = element.clientWidth;
      element.height = element.clientHeight;
    };
    resize();
    let drops: Drop[] = Array.from({ length: wanted() }, () =>
      spawn(Math.random() * element.height),
    );
    let owed = 0;
    window.addEventListener('resize', resize);
    let frame = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      // New drops start above the screen, a few at a time, so that a shower builds up.
      const count = wanted();
      if (drops.length < count) {
        owed += (count / WEATHER_RAMP_SECONDS) * delta;
        while (owed >= 1 && drops.length < count) {
          drops.push(spawn(-20 - Math.random() * 40));
          owed -= 1;
        }
      }
      drawing.clearRect(0, 0, element.width, element.height);
      drawing.lineCap = 'round';
      drops = drops.filter((drop) => {
        drop.y += drop.speed * (calm ? 0.4 : 1) * delta;
        drop.sway += delta;
        drop.x += drop.isSnow ? Math.sin(drop.sway) * 0.6 : -drop.speed * 0.18 * delta;
        if (drop.x < -20) {
          drop.x += element.width + 40;
        }
        if (drop.y > element.height + 20) {
          // A drop that has fallen goes round again, unless the shower is easing off.
          if (drops.length > wanted()) {
            return false;
          }
          Object.assign(drop, spawn(-20));
        }
        if (drop.isSnow) {
          drawing.fillStyle = 'rgb(255 255 255 / 90%)';
          drawing.beginPath();
          drawing.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
          drawing.fill();
        } else {
          drawing.strokeStyle = 'rgb(225 238 255 / 55%)';
          drawing.lineWidth = 2;
          drawing.beginPath();
          drawing.moveTo(drop.x, drop.y);
          drawing.lineTo(drop.x + drop.size * 0.18, drop.y - drop.size);
          drawing.stroke();
        }
        return true;
      });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      drawing.clearRect(0, 0, element.width, element.height);
    };
  }, [isOutside]);

  // A storm's lightning: a soft flash every so often, left out for players who ask for less motion.
  useEffect(() => {
    if (!isOutside || weather !== 'storm') {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const strike = () => {
      timer = setTimeout(
        () => {
          setFlash(true);
          timer = setTimeout(() => {
            setFlash(false);
            strike();
          }, 140);
        },
        6000 + Math.random() * 9000,
      );
    };
    strike();
    return () => {
      clearTimeout(timer);
      setFlash(false);
    };
  }, [isOutside, weather]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <canvas ref={canvas} className="absolute inset-0 size-full" />
      <div
        className={`absolute inset-0 bg-white transition-opacity duration-100 ${
          flash ? 'opacity-35' : 'opacity-0'
        }`}
      />
    </div>
  );
}
