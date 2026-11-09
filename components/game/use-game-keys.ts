import { type RefObject, useEffect } from 'react';
import { isMovementKey, keyboardDirection } from '@/game/world/movement';
import type { Interaction } from '@/game/world/world';
import type { MovementInput } from './scene/stage';

const INTERACT_KEY = 'KeyE';
const DASH_KEY = 'Space';
// Shortcuts to the menus of the top of the screen, by where the key sits, like the movement keys.
const BAG_KEY = 'KeyB';
const BINDER_KEY = 'KeyC';
const SETTINGS_KEY = 'Escape';

// What the keys reach, read anew at each press: the game changes it at every render.
export type GameKeyControls = {
  interaction: Interaction | null;
  isDialogOpen: boolean;
  hasBoosters: boolean;
  interact: () => void;
  openBag: () => void;
  openBinder: () => void;
  openSettings: () => void;
};

// The keyboard while walking about: the movement keys and the dash move the character, the interact
// key does what the place offers, and the shortcuts open the menus. While a dialog, a game or a
// conversation is open, the keys belong to it.
export function useGameKeys(input: RefObject<MovementInput>, controls: RefObject<GameKeyControls>) {
  useEffect(() => {
    const pressedKeys = new Set<string>();

    const update = () => {
      input.current.keyboard = keyboardDirection(pressedKeys);
    };
    const releaseKeys = () => {
      pressedKeys.clear();
      update();
    };
    // A button reached with the keyboard keeps Space, but one that was only clicked doesn't. The
    // browser's own :focus-visible can't tell, since it turns on as soon as a key is pressed.
    let lastUsedPointer = false;
    const onPointerDown = () => {
      lastUsedPointer = true;
    };
    const isPressingAButton = () =>
      !lastUsedPointer && document.activeElement?.tagName === 'BUTTON';
    // Whether anything had the keys when this press began: a dialog, a game or a conversation.
    // Read before anything else hears the press, since Escape closes a dialog on its way, and the
    // settings must not open in its place.
    let wasBusy = false;
    const isBusy = () =>
      controls.current.isDialogOpen || document.querySelector('dialog[open]') !== null;
    const onKeyDownFirst = () => {
      wasBusy = isBusy();
    };
    // A shortcut is a key on its own, so that the browser's own, such as copying, still work.
    const isShortcut = (event: KeyboardEvent, code: string) =>
      event.code === code && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Tab') {
        lastUsedPointer = false;
      }
      if (wasBusy || isBusy()) {
        return;
      }
      if (isShortcut(event, SETTINGS_KEY)) {
        event.preventDefault();
        releaseKeys();
        controls.current.openSettings();
        return;
      }
      if (isShortcut(event, BINDER_KEY)) {
        event.preventDefault();
        releaseKeys();
        controls.current.openBinder();
        return;
      }
      if (isShortcut(event, BAG_KEY) && controls.current.hasBoosters) {
        event.preventDefault();
        releaseKeys();
        controls.current.openBag();
        return;
      }
      if (event.code === INTERACT_KEY && controls.current.interaction) {
        event.preventDefault();
        releaseKeys();
        controls.current.interact();
      } else if (event.code === DASH_KEY && !isPressingAButton()) {
        event.preventDefault();
        if (!event.repeat) {
          input.current.wantsDash = true;
        }
      } else if (isMovementKey(event.code)) {
        event.preventDefault();
        // Walking away from a menu button gives Space back to the dash.
        (document.activeElement as HTMLElement | null)?.blur();
        pressedKeys.add(event.code);
        update();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.code);
      update();
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDownFirst, { capture: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    // A key released in another window never sends keyup here.
    window.addEventListener('blur', releaseKeys);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDownFirst, { capture: true });
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseKeys);
    };
  }, [input, controls]);
}
