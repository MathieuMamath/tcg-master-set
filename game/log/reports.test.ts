import { expect, test } from 'vitest';
import { PLAYABLE_SET_IDS } from '../cards/card-sets';
import { parseReport } from './reports';

const SET = PLAYABLE_SET_IDS[0];

test('takes what players do, by the game own names', () => {
  expect(parseReport({ type: 'npc.talked', speaker: 'gaspard' })).toEqual({
    type: 'npc.talked',
    details: { speaker: 'gaspard' },
  });
  expect(parseReport({ type: 'shop.viewed', stock: 'binderSeller' })).toEqual({
    type: 'shop.viewed',
    details: { stock: 'binderSeller' },
  });
  expect(parseReport({ type: 'binder.viewed', setId: SET })).toEqual({
    type: 'binder.viewed',
    details: { setId: SET },
  });
  expect(parseReport({ type: 'booster.abandoned', setId: SET })).toEqual({
    type: 'booster.abandoned',
    details: { setId: SET },
  });
});

test('refuses unknown names, types or shapes', () => {
  expect(parseReport({ type: 'npc.talked', speaker: 'stranger' })).toBeNull();
  expect(parseReport({ type: 'shop.viewed', stock: 'everything' })).toBeNull();
  expect(parseReport({ type: 'binder.viewed', setId: 'nope' })).toBeNull();
  expect(parseReport({ type: 'booster.opened', setId: SET })).toBeNull();
  expect(parseReport(null)).toBeNull();
});
