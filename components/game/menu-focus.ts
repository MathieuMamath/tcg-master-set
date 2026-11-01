import type { KeyboardEvent } from 'react';
import { horizontalStep, nextChoice, verticalStep } from '@/game/menu-keys';

function moveFocus(container: HTMLElement, step: -1 | 1) {
  const choices = Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not(:disabled):not([aria-disabled="true"]), input',
    ),
  ).filter((choice) => !choice.closest('[inert]'));
  const current = choices.indexOf(document.activeElement as HTMLElement);
  choices[nextChoice(current, step, choices.length)]?.focus();
}

export function moveThroughChoices(event: KeyboardEvent<HTMLElement>) {
  const step = verticalStep(event.code) ?? horizontalStep(event.code);
  if (step) {
    event.preventDefault();
    moveFocus(event.currentTarget, step);
  }
}

// For binder pages, where the left and right keys turn the page.
export function moveThroughChoicesVertically(event: KeyboardEvent<HTMLElement>) {
  const step = verticalStep(event.code);
  if (step) {
    event.preventDefault();
    moveFocus(event.currentTarget, step);
  }
}

// Removing or disabling the focused element sends the focus to the page, where no key does anything.
export function isFocusLost(): boolean {
  return document.activeElement === document.body || document.activeElement === null;
}
