const VERTICAL_STEPS: Record<string, -1 | 1> = { ArrowUp: -1, KeyW: -1, ArrowDown: 1, KeyS: 1 };
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

// Goes round at both ends. With nothing chosen yet, a step lands on the nearest end.
export function nextChoice(current: number, step: -1 | 1, count: number): number {
  if (current < 0) {
    return step === 1 ? 0 : count - 1;
  }
  return (current + step + count) % count;
}
