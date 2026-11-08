import { dishInHand, serviceGuests, simulateService } from './ramen-service';
import type { ShiftAction } from './shifts';

// A perfect waiter's presses: every fifth of a second, a table left dirty is cleared, or else the
// bowl in hand goes to the most impatient guest who ordered it.
export function perfectService(seed: number, until: number): ShiftAction[] {
  const guests = serviceGuests(seed);
  const presses: ShiftAction[] = [];
  for (let ms = 0; ms <= until; ms += 200) {
    const state = simulateService(seed, presses, ms, guests);
    if (!state) {
      continue;
    }
    const dirty = state.tables.findIndex((seat) => seat?.outcome === 'dirty');
    if (dirty >= 0) {
      presses.push([ms, dirty]);
      continue;
    }
    const hand = dishInHand(state);
    const tables = state.tables
      .map((seat, table) => ({ seat, table }))
      .filter(
        ({ seat }) => hand && seat?.outcome === 'waiting' && guests[seat.guest].dish === hand.dish,
      )
      .sort((a, b) => (a.seat?.seatedAt ?? 0) - (b.seat?.seatedAt ?? 0));
    if (tables[0]) {
      presses.push([ms, tables[0].table]);
    }
  }
  return presses;
}
