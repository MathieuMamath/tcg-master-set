'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { authClient } from '@/auth/client';
import type { Player } from '@/auth/session';
import { addToCollection, type Collection } from '@/game/binder';
import { isMovementKey, keyboardDirection, STILL } from '@/game/movement';
import { buyBooster, STARTING_WALLET } from '@/game/shop-dialogue';
import type { Interaction } from '@/game/world';
import { BinderView } from './binder-view';
import { BoosterOpening, type Opening } from './booster-opening';
import { loadCollection, saveCollection } from './collection-storage';
import { Joystick } from './joystick';
import type { MovementInput } from './scene';
import { ShopDialog } from './shop-dialog';

// Three.js needs the browser, and this keeps it out of the bundle of every other screen.
const Scene = dynamic(() => import('./scene').then((module) => module.Scene), { ssr: false });

const INTERACT_KEY = 'KeyE';

export function Game({ player }: { player: Player }) {
  const t = useTranslations('Game');
  const input = useRef<MovementInput>({ keyboard: STILL, joystick: STILL });
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [wallet, setWallet] = useState(STARTING_WALLET);
  const [opening, setOpening] = useState<Opening | null>(null);
  const [isBinderOpen, setIsBinderOpen] = useState(false);
  const [collection, setCollection] = useState<Collection>({});
  const locale = useLocale();
  const tBooster = useTranslations('Booster');
  const isDialogOpen = isTalking || isBinderOpen || opening !== null;
  const controls = useRef({ interaction, isDialogOpen });
  controls.current = { interaction, isDialogOpen };

  useEffect(() => {
    setCollection(loadCollection(player.id));
  }, [player.id]);

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
      // While a dialog is open, the keys belong to it.
      if (controls.current.isDialogOpen) {
        return;
      }
      if (event.code === INTERACT_KEY && controls.current.interaction) {
        event.preventDefault();
        releaseKeys();
        if (controls.current.interaction === 'talk') {
          setIsTalking(true);
        } else {
          setIsBinderOpen(true);
        }
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

  const stopWalking = () => {
    input.current.keyboard = STILL;
    input.current.joystick = STILL;
  };

  const interact = () => {
    stopWalking();
    if (interaction === 'talk') {
      setIsTalking(true);
    } else {
      setIsBinderOpen(true);
    }
  };

  const openBinder = () => {
    stopWalking();
    setIsBinderOpen(true);
  };

  // The booster only leaves the wallet once the server has drawn its cards.
  const openBooster = async () => {
    stopWalking();
    setOpening({ status: 'loading' });

    try {
      const response = await fetch(`/api/boosters/open?locale=${locale}`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { setName, cards } = await response.json();
      setWallet((current) => ({ ...current, boosters: current.boosters - 1 }));
      // Saved right away, since the draw is final even if the player closes the page now.
      const updated = addToCollection(loadCollection(player.id), cards);
      saveCollection(player.id, updated);
      setCollection(updated);
      setOpening({ status: 'ready', setName, cards });
    } catch {
      setOpening({ status: 'error' });
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    // A full load, so that the server sees the session has ended.
    window.location.assign(`/${locale}/login`);
  };

  return (
    <div className="absolute inset-0">
      <Scene
        input={input}
        webglUnavailable={t('webglUnavailable')}
        onInteractionChange={setInteraction}
        isTalking={isTalking}
      />
      <div className="absolute inset-x-4 top-0 flex flex-wrap items-start justify-between gap-2 font-game text-sm font-semibold text-ui-ink">
        <div className="flex flex-wrap gap-2">
          <p className="flex items-center gap-1.5 rounded-full border-3 border-ui-ink bg-ui-paper py-0.5 pr-3 pl-1.5">
            <span
              aria-hidden="true"
              className="size-4 rounded-full border-2 border-ui-ink bg-ui-accent"
            />
            {t('coins', { count: wallet.coins })}
          </p>
          <button
            type="button"
            disabled={wallet.boosters === 0}
            aria-label={`${t('boosters', { count: wallet.boosters })}. ${tBooster('title')}`}
            onClick={openBooster}
            className="flex items-center gap-1.5 rounded-full border-3 border-ui-ink bg-ui-paper py-0.5 pr-3 pl-2 enabled:cursor-pointer enabled:bg-ui-accent"
          >
            <span
              aria-hidden="true"
              className="h-4 w-3 rounded-xs border-2 border-ui-ink bg-[#7b5ea7]"
            />
            {t('boosters', { count: wallet.boosters })}
          </button>
          <button
            type="button"
            onClick={openBinder}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border-3 border-ui-ink bg-ui-paper py-0.5 pr-3 pl-2"
          >
            <span
              aria-hidden="true"
              className="h-4 w-3.5 rounded-xs border-2 border-l-4 border-ui-ink bg-[#2e86ab]"
            />
            {t('binderButton')}
          </button>
        </div>
        <p className="ml-auto flex items-center gap-2 rounded-full border-3 border-ui-ink bg-ui-paper py-0.5 pr-1 pl-3">
          {player.username}
          <button
            type="button"
            onClick={signOut}
            className="cursor-pointer rounded-full bg-ui-ink/10 px-2 hover:bg-ui-ink/20"
          >
            {t('signOut')}
          </button>
        </p>
      </div>
      {interaction && !isDialogOpen && (
        <button
          type="button"
          onClick={interact}
          className="ui-bob absolute inset-x-0 bottom-16 mx-auto flex w-fit cursor-pointer items-center gap-2 rounded-full border-4 border-ui-ink bg-ui-paper py-1 pr-4 pl-1.5 font-game text-lg font-semibold text-ui-ink shadow-[0_4px_0_var(--ui-ink)]"
        >
          <kbd className="rounded-full border-3 border-ui-ink bg-ui-accent px-2 font-game text-sm pointer-coarse:hidden">
            E
          </kbd>
          {t(interaction)}
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
      {isBinderOpen && (
        <BinderView collection={collection} onClose={() => setIsBinderOpen(false)} />
      )}
      {opening && (
        <BoosterOpening opening={opening} onRetry={openBooster} onClose={() => setOpening(null)} />
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
