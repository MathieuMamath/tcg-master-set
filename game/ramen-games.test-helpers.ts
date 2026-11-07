import type { ShiftAction } from './ramen';
import { canDo, dirtyBowls, simulateDishes } from './ramen-dishes';
import { isBowlInZone, KITCHEN_INGREDIENTS, kitchenOrders, simulateKitchen } from './ramen-kitchen';

// A perfect washer, every quarter of a second: scrub, rinse, stack, and carry the pile at five.
export function perfectDishes(seed: number, until = 45_000): ShiftAction[] {
  const bowls = dirtyBowls(seed);
  const presses: ShiftAction[] = [];
  for (let ms = 0; ms <= until; ms += 250) {
    const state = simulateDishes(seed, presses, ms, bowls);
    if (!state || state.endedAt !== null) {
      break;
    }
    if (state.pile >= 5 && canDo(state, 'deliver')) {
      presses.push([ms, 3]);
    } else if (canDo(state, 'scrub')) {
      presses.push([ms, state.stainsLeft > 0 ? 0 : state.isRinsed ? 2 : 1]);
    }
  }
  return presses;
}

// A perfect helper, every quarter of a second: the next missing ingredient of the bowl in the zone.
export function perfectKitchen(seed: number, until = 45_000): ShiftAction[] {
  const orders = kitchenOrders(seed);
  const presses: ShiftAction[] = [];
  for (let ms = 0; ms <= until; ms += 250) {
    const state = simulateKitchen(seed, presses, ms, orders);
    if (!state || state.endedAt !== null || !isBowlInZone(state)) {
      continue;
    }
    const missing = orders[state.order].ingredients.find((item) => !state.added.includes(item));
    if (missing) {
      presses.push([ms, KITCHEN_INGREDIENTS.indexOf(missing)]);
    }
  }
  return presses;
}
