import { canShoot, nearestSubject, simulatePhotos, skySubjects } from './city-photos';
import type { ShiftAction } from './shifts';

// A photographer who shoots each subject at its closest to the centre, when that is within
// `within`, looking every twentieth of a second.
export function perfectPhotos(seed: number, within = 6, until = 45_000): ShiftAction[] {
  const subjects = skySubjects(seed);
  const presses: ShiftAction[] = [];
  for (let ms = 0; ms <= until; ms += 50) {
    const state = simulatePhotos(seed, presses, ms, subjects);
    if (!state || state.endedAt !== null) {
      break;
    }
    const nearest = nearestSubject(subjects, ms);
    const next = nearestSubject(subjects, ms + 50);
    const isClosest = !next || next.index !== nearest?.index || next.distance > nearest.distance;
    if (canShoot(state) && nearest && nearest.distance <= within && isClosest) {
      presses.push([ms, 0]);
    }
  }
  return presses;
}
