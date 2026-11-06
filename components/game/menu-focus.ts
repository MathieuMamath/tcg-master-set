import type { KeyboardEvent } from 'react';
import { horizontalStep, nextChoice, verticalStep } from '@/game/menu-keys';
import { nearestInDirection } from '@/game/spatial-focus';

function choicesIn(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not(:disabled):not([aria-disabled="true"]), input',
    ),
  ).filter((choice) => !choice.closest('[inert]'));
}

function moveFocus(container: HTMLElement, step: -1 | 1) {
  const choices = choicesIn(container);
  const current = choices.indexOf(document.activeElement as HTMLElement);
  choices[nextChoice(current, step, choices.length)]?.focus();
}

// While typing in a field, its letters and arrows are the field's own: no choice is moved to.
function isTyping(target: EventTarget): boolean {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return true;
  }
  return (
    target instanceof HTMLInputElement &&
    !['button', 'checkbox', 'radio', 'submit', 'reset'].includes(target.type)
  );
}

export function moveThroughChoices(event: KeyboardEvent<HTMLElement>) {
  if (isTyping(event.target)) {
    return;
  }
  const step = verticalStep(event.code) ?? horizontalStep(event.code);
  if (step) {
    event.preventDefault();
    moveFocus(event.currentTarget, step);
  }
}

// For things laid out in two dimensions, such as binder pages: each arrow goes to the nearest
// choice on screen that lies that way.
export function moveThroughChoicesOnScreen(event: KeyboardEvent<HTMLElement>) {
  if (isTyping(event.target)) {
    return;
  }
  const x = horizontalStep(event.code) ?? 0;
  const y = verticalStep(event.code) ?? 0;
  if (x === 0 && y === 0) {
    return;
  }
  event.preventDefault();
  const choices = choicesIn(event.currentTarget);
  const current = choices.indexOf(document.activeElement as HTMLElement);
  if (current < 0) {
    choices[0]?.focus();
    return;
  }
  const boxes = choices.map((choice) => choice.getBoundingClientRect());
  const next = nearestInDirection(boxes, current, { x, y });
  if (next !== undefined) {
    choices[next]?.focus();
  }
}

// Removing or disabling the focused element sends the focus to the page, where no key does anything.
export function isFocusLost(): boolean {
  return document.activeElement === document.body || document.activeElement === null;
}
