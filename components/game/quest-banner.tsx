'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { secondsLeft } from '@/game/quests';

const URGENT_SECONDS = 5;

type Props = {
  startedAt: number;
  stainsLeft: number;
  onTimeUp: () => void;
};

// The time left and the stains to go, while the quest is running.
export function QuestBanner({ startedAt, stainsLeft, onTimeUp }: Props) {
  const t = useTranslations('Quest');
  const [left, setLeft] = useState(() => secondsLeft(startedAt, Date.now()));

  useEffect(() => {
    const timer = setInterval(() => {
      const next = secondsLeft(startedAt, Date.now());
      setLeft(next);
      if (next === 0) {
        clearInterval(timer);
        onTimeUp();
      }
    }, 200);
    return () => clearInterval(timer);
  }, [onTimeUp, startedAt]);

  return (
    <p
      className={`pointer-events-none absolute inset-x-0 top-16 mx-auto flex w-fit items-center gap-3 ui-scrap px-4 py-1 font-game font-semibold tabular-nums ${
        left <= URGENT_SECONDS ? 'text-ui-danger' : 'text-ui-ink'
      }`}
    >
      <span>{t('timeLeft', { seconds: Math.ceil(left) })}</span>
      <span>{t('stainsLeft', { count: stainsLeft })}</span>
    </p>
  );
}
