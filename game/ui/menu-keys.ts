const VERTICAL_STEPS: Record<string, -1 | 1> = { ArrowUp: -1, KeyW: -1, ArrowDown: 1, KeyS: 1 };
const PAGE_STEPS: Record<string, -1 | 1> = { PageUp: -1, PageDown: 1 };
const HORIZONTAL_STEPS: Record<string, -1 | 1> = {
  ArrowLeft: -1,
  KeyA: -1,
  ArrowRight: 1,
  KeyD: 1,
};

// Menus are walked through with the same keys that move the character.
export function verticalStep(code: string): -1 | 1 | undefined {
  return VERTICAL_STEPS[code];
}

export function horizontalStep(code: string): -1 | 1 | undefined {
  return HORIZONTAL_STEPS[code];
}

// Turning a whole page, such as in a binder, where the arrows move from pocket to pocket.
export function pageStep(code: string): -1 | 1 | undefined {
  return PAGE_STEPS[code];
}

// Goes round at both ends. With nothing chosen yet, a step lands on the nearest end.
export function nextChoice(current: number, step: -1 | 1, count: number): number {
  if (current < 0) {
    return step === 1 ? 0 : count - 1;
  }
  return (current + step + count) % count;
}

// In a grid, the left and right keys move one item, and the up and down keys a whole row. Nothing
// goes round: a step past an edge stays where it is.
export function gridStep(
  current: number,
  code: string,
  columns: number,
  count: number,
): number | undefined {
  const step = horizontalStep(code) ?? (verticalStep(code) ?? 0) * columns;
  if (step === 0) {
    return undefined;
  }
  if (current < 0) {
    return 0;
  }
  const next = current + step;
  return next < 0 || next >= count ? current : next;
}
