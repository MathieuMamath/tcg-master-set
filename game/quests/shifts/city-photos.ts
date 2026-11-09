// Flash's photos of the big city's sky: hot-air balloons drift and kites dart across the camera's
// frame, and the player has a roll of eight shots to take them as close to the frame's centre as
// they can. A sharp shot, the subject right in the middle, scores most, and a kite, quicker and
// zigzagging, more than a balloon. A shot with nothing near the centre is a mistake. The camera's
// flash needs a moment between shots, and the sky gets busier as the shift goes on.
//
// Everything follows from the seed and the shots, so that the browser draws the same shift the
// server plays again: `simulatePhotos` is both. A press is the shutter, the only choice.

import { seededRandom } from '../../seeded-random';
import type { ShiftAction } from './shifts';

export const PHOTO_ROLL = 8;
export const PHOTOS_MISTAKE_LIMIT = 3;
// How long the flash takes to charge again after a shot.
export const FLASH_MS = 700;
const SHIFT_MS = 45_000;

export const SUBJECT_KINDS = ['balloon', 'kite'] as const;
export type SubjectKind = (typeof SUBJECT_KINDS)[number];

// How close to the centre, in hundredths of the frame, each quality of shot is.
export const PHOTO_QUALITIES = [
  { quality: 'sharp', within: 5 },
  { quality: 'good', within: 10 },
  { quality: 'fair', within: 16 },
] as const;
export type PhotoQuality = (typeof PHOTO_QUALITIES)[number]['quality'] | 'missed';
const POINTS: Record<SubjectKind, Record<PhotoQuality, number>> = {
  balloon: { sharp: 10, good: 6, fair: 3, missed: 0 },
  kite: { sharp: 14, good: 8, fair: 4, missed: 0 },
};

export type Subject = {
  kind: SubjectKind;
  // When it enters the frame, how long it takes to cross it, and which way.
  at: number;
  crossing: number;
  fromLeft: boolean;
  // Its height across the frame, from where it enters to where it leaves, in hundredths, and how
  // far and how quickly it bobs or zigzags about that line.
  fromY: number;
  toY: number;
  sway: number;
  swayMs: number;
};

// The sky's visitors, closer together and quicker as the shift goes on: kites more often later.
export function skySubjects(seed: number): Subject[] {
  const random = seededRandom(seed ^ 0xf1a5);
  const subjects: Subject[] = [];
  let at = 600;
  for (let index = 0; at < SHIFT_MS; index++) {
    const kind: SubjectKind = random() < 0.35 + Math.min(0.3, index * 0.02) ? 'kite' : 'balloon';
    const pace = Math.max(0.7, 1 - index * 0.02);
    subjects.push({
      kind,
      at,
      crossing: Math.round((kind === 'kite' ? 5000 : 8000) * pace + random() * 1500),
      fromLeft: random() < 0.5,
      // Its path crosses the middle of the frame near its centre, a little higher or lower, slanting
      // up or down.
      ...pathThrough(50 + (random() - 0.5) * 14, (random() - 0.5) * 36),
      sway: kind === 'kite' ? 10 + random() * 8 : 3 + random() * 3,
      swayMs: kind === 'kite' ? 1400 + random() * 600 : 2800 + random() * 800,
    });
    at += Math.round(Math.max(1700, 3400 - index * 90) + random() * 900);
  }
  return subjects;
}

// A path whose height is `middle` halfway across the frame, rising or falling by `slant`.
function pathThrough(middle: number, slant: number): { fromY: number; toY: number } {
  return { fromY: middle - slant / 2, toY: middle + slant / 2 };
}

// Where a subject is in the frame, in hundredths from the top left, or null when out of it.
export function subjectAt(subject: Subject, now: number): { x: number; y: number } | null {
  const share = (now - subject.at) / subject.crossing;
  if (share < 0 || share > 1) {
    return null;
  }
  // It enters and leaves a little outside the frame, so that it slides in and out.
  const across = -12 + share * 124;
  const swayAngle = ((now - subject.at) / subject.swayMs) * Math.PI * 2;
  return {
    x: subject.fromLeft ? across : 100 - across,
    y: subject.fromY + (subject.toY - subject.fromY) * share + Math.sin(swayAngle) * subject.sway,
  };
}

// The subject nearest the frame's centre, and how far, or null with nothing in the frame.
export function nearestSubject(
  subjects: readonly Subject[],
  now: number,
): { index: number; distance: number } | null {
  let nearest: { index: number; distance: number } | null = null;
  for (let index = 0; index < subjects.length && subjects[index].at <= now; index++) {
    const place = subjectAt(subjects[index], now);
    if (place) {
      const distance = Math.hypot(place.x - 50, place.y - 50);
      if (!nearest || distance < nearest.distance) {
        nearest = { index, distance };
      }
    }
  }
  return nearest;
}

export function qualityOf(distance: number): PhotoQuality {
  return PHOTO_QUALITIES.find(({ within }) => distance <= within)?.quality ?? 'missed';
}

export type Photo = {
  at: number;
  // The subject taken, by its index, or null when the frame held nothing.
  subject: number | null;
  quality: PhotoQuality;
  points: number;
};

export type PhotosState = {
  now: number;
  photos: Photo[];
  score: number;
  mistakes: number;
  endedAt: number | null;
};

function freshPhotos(): PhotosState {
  return { now: 0, photos: [], score: 0, mistakes: 0, endedAt: null };
}

export function photosPoints(state: Pick<PhotosState, 'score'>): number {
  return state.score;
}

export function filmLeft(state: Pick<PhotosState, 'photos'>): number {
  return PHOTO_ROLL - state.photos.length;
}

// Whether the shutter can be pressed now: film left, and the flash charged.
export function canShoot(state: PhotosState): boolean {
  const last = state.photos.at(-1);
  return (
    state.endedAt === null && filmLeft(state) > 0 && (!last || state.now - last.at >= FLASH_MS)
  );
}

function shoot(state: PhotosState, subjects: readonly Subject[]): boolean {
  if (!canShoot(state)) {
    return false;
  }
  const at = state.now;
  const nearest = nearestSubject(subjects, at);
  const quality = nearest ? qualityOf(nearest.distance) : 'missed';
  const points = nearest ? POINTS[subjects[nearest.index].kind][quality] : 0;
  state.photos.push({
    at,
    subject: nearest && quality !== 'missed' ? nearest.index : null,
    quality,
    points,
  });
  state.score += points;
  if (quality === 'missed') {
    state.mistakes += 1;
  }
  if (state.mistakes >= PHOTOS_MISTAKE_LIMIT || filmLeft(state) === 0) {
    state.endedAt = at;
  }
  return true;
}

export function simulatePhotos(
  seed: number,
  presses: readonly ShiftAction[],
  until: number,
  subjects: readonly Subject[] = skySubjects(seed),
): PhotosState | null {
  const state = freshPhotos();
  for (const [ms] of presses) {
    state.now = ms;
    if (!shoot(state, subjects)) {
      return null;
    }
  }
  state.now = state.endedAt === null ? Math.max(until, state.now) : state.endedAt;
  return state;
}
