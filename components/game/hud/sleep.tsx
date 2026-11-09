import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { isValidOffset } from '@/game/world/clock';

// How long the screen stays dark for a night's sleep, and the morning takes to come back.
const NIGHT_MILLISECONDS = 1800;
const WAKING_MILLISECONDS = 1600;

export type Sleep = 'asleep' | 'waking' | null;

// At night, Pip sleeps until the morning: the server moves the clock on, while the screen goes
// dark for a moment. By day, he isn't sleepy and the bed does nothing.
export function useSleep(
  canSleep: boolean,
  onFallAsleep: () => void,
  onClockMoved: (offset: number) => void,
) {
  const [sleep, setSleep] = useState<Sleep>(null);

  const goToBed = async () => {
    if (!canSleep || sleep !== null) {
      return;
    }
    onFallAsleep();
    setSleep('asleep');
    const fellAsleep = Date.now();
    let slept: number | null = null;
    try {
      const response = await fetch('/api/player/sleep', { method: 'POST' });
      if (response.ok) {
        const { clockOffset: offset } = (await response.json()) as { clockOffset: unknown };
        slept = isValidOffset(offset) ? offset : null;
      }
    } catch {
      // The night is simply cut short.
    }
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, NIGHT_MILLISECONDS - (Date.now() - fellAsleep))),
    );
    if (slept === null) {
      setSleep(null);
      return;
    }
    onClockMoved(slept);
    setSleep('waking');
    await new Promise((resolve) => setTimeout(resolve, WAKING_MILLISECONDS));
    setSleep(null);
  };

  return { sleep, goToBed };
}

// A night's sleep: the screen goes dark, then the morning comes back.
export function SleepScreen({ sleep, name }: { sleep: Sleep; name: string }) {
  const t = useTranslations('Game');
  return (
    <div
      role="status"
      className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-[#141b33] font-display text-3xl text-ui-paper transition-opacity duration-700 ${
        sleep === 'asleep' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {sleep === 'asleep' && t('sleeping', { name })}
      {sleep === 'waking' && <span className="sr-only">{t('wakingUp')}</span>}
    </div>
  );
}
