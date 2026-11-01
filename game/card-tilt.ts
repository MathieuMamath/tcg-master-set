// Low enough that the back of the card can never come into view.
export const MAX_TILT_DEGREES = 14;

export const FLAT_TILT = { rotateX: 0, rotateY: 0 };

type Area = { left: number; top: number; width: number; height: number };

function fromCenter(position: number, start: number, size: number) {
  const distance = ((position - start) / size) * 2 - 1;
  return Math.max(-1, Math.min(1, distance));
}

// The side of the card under the pointer leans away from the player.
export function cardTilt(pointerX: number, pointerY: number, area: Area) {
  return {
    rotateX: -fromCenter(pointerY, area.top, area.height) * MAX_TILT_DEGREES,
    rotateY: fromCenter(pointerX, area.left, area.width) * MAX_TILT_DEGREES,
  };
}
