import { beforeEach, expect, test, vi } from 'vitest';
import { loadCollection, saveCollection } from './collection-storage';

function stubStorage() {
  const items = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
  });
}

beforeEach(stubStorage);

test('reads back what was saved', () => {
  saveCollection('player-1', { 'card:normal': 2 });

  expect(loadCollection('player-1')).toEqual({ 'card:normal': 2 });
});

test('keeps each player on the same browser apart', () => {
  saveCollection('player-1', { 'card:normal': 2 });

  expect(loadCollection('player-2')).toEqual({});
});

test('survives storage that refuses to work', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  });

  expect(() => saveCollection('player-1', {})).not.toThrow();
  expect(loadCollection('player-1')).toEqual({});
});
