import type { SidePlaceId } from './side-rooms';

// The stops the bus serves, in the order of its route. A stop with no place yet is shown on the
// map, closed for works, until its place is built.
export type BusStop = { id: 'mainStreet' | 'park'; place: SidePlaceId | null };

export const BUS_STOPS: readonly BusStop[] = [
  { id: 'mainStreet', place: 'town' },
  { id: 'park', place: null },
];

export type BusStopId = BusStop['id'];

// The stop where the player stands, from the place they are in.
export function stopAt(place: SidePlaceId): BusStop | undefined {
  return BUS_STOPS.find((stop) => stop.place === place);
}

export function isOpen(stop: BusStop): boolean {
  return stop.place !== null;
}
