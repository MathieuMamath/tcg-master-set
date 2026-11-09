'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

// A key drawn as a keyboard key: a paper cap standing on a darker edge, the way it sits on the
// keyboard. Its name for screen readers is the key's own, so that "←" reads as an arrow.
function Key({ label, children }: { label: string; children: ReactNode }) {
  return (
    <kbd
      aria-label={label}
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-ui-ink/25 border-b-4 bg-ui-paper px-2 font-digits text-sm font-bold text-ui-ink shadow-[1px_2px_0_var(--ui-shadow)]"
    >
      {children}
    </kbd>
  );
}

function Or() {
  const t = useTranslations('Game.controls');
  return <span className="text-sm text-ui-ink/60">{t('or')}</span>;
}

// The keys the player can use while walking about, along the bottom of the screen. Players on a
// touch screen have the joystick and the dash button instead, so it only shows with a mouse, on a
// screen wide enough for the whole row.
export function ControlsLegend() {
  const t = useTranslations('Game.controls');
  return (
    <ul
      aria-label={t('label')}
      className="pointer-events-none absolute inset-x-0 bottom-8 mx-auto hidden w-fit min-[48rem]:pointer-fine:flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 font-game text-lg text-ui-ink select-none"
    >
      <li className="flex items-center gap-1.5">
        <Key label={t('keys.arrowLeft')}>
          <span className="text-lg leading-none">←</span>
        </Key>
        <Key label={t('keys.arrowRight')}>
          <span className="text-lg leading-none">→</span>
        </Key>
        <Or />
        <Key label={t('keys.left')}>{t('keys.left')}</Key>
        <Key label={t('keys.right')}>{t('keys.right')}</Key>
        <span className="ml-1">{t('walk')}</span>
      </li>
      <li className="flex items-center gap-1.5">
        <Key label={t('keys.space')}>
          <span className="px-3">{t('keys.space')}</span>
        </Key>
        <span className="ml-1">{t('dash')}</span>
      </li>
      <li className="flex items-center gap-1.5">
        <Key label={t('keys.bag')}>{t('keys.bag')}</Key>
        <span className="ml-1">{t('bag')}</span>
      </li>
      <li className="flex items-center gap-1.5">
        <Key label={t('keys.binder')}>{t('keys.binder')}</Key>
        <span className="ml-1">{t('binder')}</span>
      </li>
    </ul>
  );
}
