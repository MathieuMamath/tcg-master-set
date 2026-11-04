import { PARK_SPOTS, type SidePlaceId, TOWN_BUILDINGS } from './side-rooms';

// The stops the bus serves, in the order of its route, and where the player gets off at each:
// just past the stop's sign, facing along the street.
export type BusStop = { id: 'mainStreet' | 'park'; place: SidePlaceId; arrivalX: number };

const GETTING_OFF = 0.5;

export const BUS_STOPS: readonly BusStop[] = [
  { id: 'mainStreet', place: 'town', arrivalX: TOWN_BUILDINGS.busStop.signX + GETTING_OFF },
  { id: 'park', place: 'park', arrivalX: PARK_SPOTS.busStop.signX + GETTING_OFF },
];

export type BusStopId = BusStop['id'];

// The stop where the player stands, from the place they are in.
export function stopAt(place: SidePlaceId): BusStop | undefined {
  return BUS_STOPS.find((stop) => stop.place === place);
}
