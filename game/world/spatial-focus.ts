// Moving the focus by direction across things laid out on screen, such as the pockets of two
// binder pages side by side: the arrow keys go to the nearest one that lies that way.

export type Box = { x: number; y: number; width: number; height: number };
export type Direction = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

// Straying from the line counts this much more than going further along it, so that the focus
// keeps to its row or its column when it can.
const ACROSS_WEIGHT = 3;

function middle({ x, y, width, height }: Box) {
  return { x: x + width / 2, y: y + height / 2 };
}

export function nearestInDirection(
  boxes: readonly Box[],
  from: number,
  direction: Direction,
): number | undefined {
  const start = boxes[from];
  if (!start) {
    return undefined;
  }
  const origin = middle(start);
  let best: { index: number; score: number } | undefined;
  for (const [index, box] of boxes.entries()) {
    if (index === from) {
      continue;
    }
    const point = middle(box);
    const along =
      direction.x !== 0 ? (point.x - origin.x) * direction.x : (point.y - origin.y) * direction.y;
    const across = direction.x !== 0 ? Math.abs(point.y - origin.y) : Math.abs(point.x - origin.x);
    // Only what lies ahead, past half of the box the focus is on.
    const halfSize = direction.x !== 0 ? start.width / 2 : start.height / 2;
    if (along < halfSize) {
      continue;
    }
    const score = along + across * ACROSS_WEIGHT;
    if (!best || score < best.score) {
      best = { index, score };
    }
  }
  return best?.index;
}
