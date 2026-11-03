'use client';

import { useTranslations } from 'next-intl';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { countAt, countDuration } from '@/game/count-animation';

// Matches the duration of the ui-count-change and ui-count-tint animations.
const CHANGE_MILLISECONDS = 1800;

type Props = {
  value: number;
  format: (count: number) => string;
};

// Rolls to each new value, with a green arrow when it goes up and a red one when it goes down. Its
// parent has to be positioned, because the arrow hangs below it. Screen readers only get the value.
export function AnimatedCount({ value, format }: Props) {
  const t = useTranslations('Game');
  const [shown, setShown] = useState(value);
  const [change, setChange] = useState<{ id: number; delta: number } | null>(null);
  const previous = useRef(value);
  const current = useRef(value);
  const changes = useRef(0);

  useEffect(() => {
    if (value === previous.current) {
      return;
    }
    const delta = value - previous.current;
    previous.current = value;
    changes.current += 1;
    setChange({ id: changes.current, delta });

    // From the number on screen, which may still be rolling towards the last value.
    const from = current.current;
    const duration = countDuration(from, value);
    const isStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const start = performance.now();
    const roll = (now: number) => {
      const progress = isStill ? 1 : (now - start) / duration;
      current.current = countAt(from, value, progress);
      setShown(current.current);
      if (progress < 1) {
        frame = requestAnimationFrame(roll);
      }
    };
    frame = requestAnimationFrame(roll);
    const timer = setTimeout(() => setChange(null), CHANGE_MILLISECONDS);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [value]);

  const isUp = change !== null && change.delta > 0;

  return (
    <>
      <span className="sr-only">{format(value)}</span>
      <span
        key={change?.id}
        aria-hidden="true"
        style={
          change
            ? ({ '--count-color': `var(${isUp ? '--ui-gain' : '--ui-danger'})` } as CSSProperties)
            : undefined
        }
        className={`tabular-nums ${change ? 'ui-count-bump' : ''}`}
      >
        {format(shown)}
      </span>
      {change && (
        <span
          key={`change-${change.id}`}
          aria-hidden="true"
          className={`ui-count-change pointer-events-none absolute top-full left-3 z-10 mt-1 flex items-center gap-1 ui-scrap px-2 text-xs font-bold whitespace-nowrap ${
            isUp ? 'text-ui-gain' : 'text-ui-danger'
          }`}
        >
          <svg aria-hidden="true" viewBox="0 0 10 12" className="h-3 w-2.5 fill-current">
            <path d={isUp ? 'M5 0 10 6H6.5V12h-3V6H0Z' : 'M5 12 0 6h3.5V0h3v6H10Z'} />
          </svg>
          {t(isUp ? 'countUp' : 'countDown', { count: Math.abs(change.delta) })}
        </span>
      )}
    </>
  );
}
