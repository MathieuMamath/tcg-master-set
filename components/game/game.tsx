'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { isMovementKey, keyboardDirection, STILL } from '@/game/movement';
import { Joystick } from './joystick';
import type { MovementInput } from './scene';

// Three.js needs the browser, and this keeps it out of the bundle of every other screen.
const Scene = dynamic(() => import('./scene').then((module) => module.Scene), { ssr: false });

export function Game() {
  const t = useTranslations('Game');
  const input = useRef<MovementInput>({ keyboard: STILL, joystick: STILL });

  useEffect(() => {
    const pressedKeys = new Set<string>();

    const update = () => {
      input.current.keyboard = keyboardDirection(pressedKeys);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (isMovementKey(event.code)) {
        event.preventDefault();
        pressedKeys.add(event.code);
        update();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.code);
      update();
    };
    // A key released in another window never sends keyup here.
    const onBlur = () => {
      pressedKeys.clear();
      update();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <Scene input={input} webglUnavailable={t('webglUnavailable')} />
      <p className="pointer-events-none absolute inset-x-0 bottom-4 px-4 text-center text-sm opacity-70 pointer-coarse:hidden">
        {t('keyboardHint')}
      </p>
      <Joystick
        onChange={(direction) => {
          input.current.joystick = direction;
        }}
      />
    </div>
  );
}
