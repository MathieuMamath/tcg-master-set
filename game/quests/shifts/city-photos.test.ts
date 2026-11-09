import { describe, expect, test } from 'vitest';
import {
  canShoot,
  FLASH_MS,
  filmLeft,
  nearestSubject,
  PHOTO_ROLL,
  PHOTOS_MISTAKE_LIMIT,
  qualityOf,
  type Subject,
  simulatePhotos,
  skySubjects,
  subjectAt,
} from './city-photos';
import { perfectPhotos } from './city-photos.test-helpers';

const SEED = 20261109;

describe('the sky', () => {
  test('sends balloons and kites across the frame, from the seed', () => {
    const subjects = skySubjects(SEED);
    expect(subjects).toEqual(skySubjects(SEED));
    expect(new Set(subjects.map(({ kind }) => kind))).toEqual(new Set(['balloon', 'kite']));
  });

  test('moves a subject in from one side and out of the other', () => {
    const subject: Subject = {
      kind: 'balloon',
      at: 0,
      crossing: 8000,
      fromLeft: true,
      fromY: 50,
      toY: 50,
      sway: 0,
      swayMs: 3000,
    };
    expect(subjectAt(subject, -1)).toBeNull();
    expect(subjectAt(subject, 4000)).toEqual({ x: 50, y: 50 });
    expect(subjectAt(subject, 8001)).toBeNull();
    expect(nearestSubject([subject], 4000)?.distance).toBe(0);
  });

  test('rates a shot by how close to the centre its subject is', () => {
    expect(qualityOf(2)).toBe('sharp');
    expect(qualityOf(8)).toBe('good');
    expect(qualityOf(14)).toBe('fair');
    expect(qualityOf(30)).toBe('missed');
  });
});

describe('a shift', () => {
  test(`uses up its roll of ${PHOTO_ROLL}, ending the shift`, () => {
    const presses = perfectPhotos(SEED, 9);
    expect(presses).toHaveLength(PHOTO_ROLL);
    const state = simulatePhotos(SEED, presses, 45_000);
    expect(state && filmLeft(state)).toBe(0);
    expect(state?.endedAt).toBe(presses.at(-1)?.[0]);
  });

  test('scores a sharp shot most, a kite more than a balloon', () => {
    const state = simulatePhotos(SEED, perfectPhotos(SEED, 4), 45_000);
    expect(state?.photos.length).toBeGreaterThan(0);
    expect(state?.photos.every(({ quality }) => quality === 'sharp')).toBe(true);
    const subjects = skySubjects(SEED);
    for (const photo of state?.photos ?? []) {
      const kind = subjects[photo.subject ?? 0].kind;
      expect(photo.points).toBe(kind === 'kite' ? 14 : 10);
    }
  });

  test('waits for the flash between shots', () => {
    const state = simulatePhotos(SEED, [[5000, 0]], 5000 + FLASH_MS - 1);
    expect(state && canShoot(state)).toBe(false);
    expect(
      simulatePhotos(
        SEED,
        [
          [5000, 0],
          [5000 + FLASH_MS - 1, 0],
        ],
        9000,
      ),
    ).toBeNull();
  });

  test(`ends after ${PHOTOS_MISTAKE_LIMIT} shots of an empty sky`, () => {
    const subjects = skySubjects(SEED);
    const empty: number[] = [];
    for (let ms = 0; ms < 45_000 && empty.length < PHOTOS_MISTAKE_LIMIT; ms += FLASH_MS) {
      const nearest = nearestSubject(subjects, ms);
      if (!nearest || nearest.distance > 20) {
        empty.push(ms);
      }
    }
    const state = simulatePhotos(
      SEED,
      empty.map((ms) => [ms, 0] as const),
      45_000,
      subjects,
    );
    expect(state?.mistakes).toBe(PHOTOS_MISTAKE_LIMIT);
    expect(state?.endedAt).toBe(empty.at(-1));
  });
});
