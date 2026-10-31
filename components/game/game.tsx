'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { isMovementKey, keyboardDirection, STILL } from '@/game/movement';
import { buyBooster, STARTING_WALLET } from '@/game/shop-dialogue';
import { Joystick } from './joystick';
import type { MovementInput } from './scene';
import { ShopDialog } from './shop-dialog';

// Three.js needs the browser, and this keeps it out of the bundle of every other screen.
const Scene = dynamic(() => import('./scene').then((module) => module.Scene), { ssr: false });

const TALK_KEY = 'KeyE';

export function Game() {
  const t = useTranslations('Game');
  const input = useRef<MovementInput>({ keyboard: STILL, joystick: STILL });
  const [canTalk, setCanTalk] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [wallet, setWallet] = useState(STARTING_WALLET);
  const interaction = useRef({ canTalk, isTalking });
  interaction.current = { canTalk, isTalking };

  useEffect(() => {
    const pressedKeys = new Set<string>();

    const update = () => {
      input.current.keyboard = keyboardDirection(pressedKeys);
    };
    const releaseKeys = () => {
      pressedKeys.clear();
      update();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      // While talking, the keys belong to the dialog.
      if (interaction.current.isTalking) {
        return;
      }
      if (event.code === TALK_KEY && interaction.current.canTalk) {
        event.preventDefault();
        releaseKeys();
        setIsTalking(true);
      } else if (isMovementKey(event.code)) {
        event.preventDefault();
        pressedKeys.add(event.code);
        update();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.code);
      update();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    // A key released in another window never sends keyup here.
    window.addEventListener('blur', releaseKeys);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseKeys);
    };
  }, []);

  const startTalking = () => {
    input.current.keyboard = STILL;
    input.current.joystick = STILL;
    setIsTalking(true);
  };

  return (
    <div className="absolute inset-0">
      <Scene
        input={input}
        webglUnavailable={t('webglUnavailable')}
        onCanTalkChange={setCanTalk}
        isTalking={isTalking}
      />
      <div className="absolute top-0 left-4 flex gap-2 font-game text-sm font-semibold text-ui-ink">
        <p className="flex items-center gap-1.5 rounded-full border-3 border-ui-ink bg-ui-paper py-0.5 pr-3 pl-1.5">
          <span
            aria-hidden="true"
            className="size-4 rounded-full border-2 border-ui-ink bg-ui-accent"
          />
          {t('coins', { count: wallet.coins })}
        </p>
        <p className="flex items-center gap-1.5 rounded-full border-3 border-ui-ink bg-ui-paper py-0.5 pr-3 pl-2">
          <span
            aria-hidden="true"
            className="h-4 w-3 rounded-xs border-2 border-ui-ink bg-[#7b5ea7]"
          />
          {t('boosters', { count: wallet.boosters })}
        </p>
      </div>
      {canTalk && !isTalking && (
        <button
          type="button"
          onClick={startTalking}
          className="ui-bob absolute inset-x-0 bottom-16 mx-auto flex w-fit cursor-pointer items-center gap-2 rounded-full border-4 border-ui-ink bg-ui-paper py-1 pr-4 pl-1.5 font-game text-lg font-semibold text-ui-ink shadow-[0_4px_0_var(--ui-ink)]"
        >
          <kbd className="rounded-full border-3 border-ui-ink bg-ui-accent px-2 font-game text-sm pointer-coarse:hidden">
            E
          </kbd>
          {t('talk')}
        </button>
      )}
      {!isTalking && (
        <>
          <p className="pointer-events-none absolute inset-x-0 bottom-4 px-4 text-center text-sm opacity-70 pointer-coarse:hidden">
            {t('keyboardHint')}
          </p>
          <Joystick
            onChange={(direction) => {
              input.current.joystick = direction;
            }}
          />
        </>
      )}
      {isTalking && (
        <ShopDialog
          onBuy={() => {
            const result = buyBooster(wallet);
            setWallet(result.wallet);
            return result.line;
          }}
          onClose={() => setIsTalking(false)}
        />
      )}
    </div>
  );
}
