import { NextRequest } from 'next/server';
import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { type MemoryCard, pickMemoryCards } from '@/cards/memory-cards';
import { startGrandpaQuest } from '@/player/quests/memory';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/cards/memory-cards', () => ({ pickMemoryCards: vi.fn() }));
vi.mock('@/player/quests/memory', () => ({ startGrandpaQuest: vi.fn() }));

const CARDS: MemoryCard[] = Array.from({ length: 8 }, (_, index) => ({
  name: `Placeholder ${index}`,
  imageUrl: null,
}));

function start(locale = 'en') {
  return POST(new NextRequest(`http://localhost/api/quests/grandpa/start?locale=${locale}`));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
  vi.mocked(pickMemoryCards).mockResolvedValue(CARDS);
  vi.mocked(startGrandpaQuest).mockResolvedValue({ hasStarted: true });
});

test('starts with the pictures of the game', async () => {
  const response = await start();

  expect(await response.json()).toEqual({ hasStarted: true, cards: CARDS });
  expect(startGrandpaQuest).toHaveBeenCalledWith('player-1');
});

test('starts nothing when the quest is already done today', async () => {
  vi.mocked(startGrandpaQuest).mockResolvedValue({ hasStarted: false });

  expect(await (await start()).json()).toEqual({ hasStarted: false, cards: [] });
});

test('starts nothing without enough cards in the catalogue', async () => {
  vi.mocked(pickMemoryCards).mockResolvedValue(CARDS.slice(1));

  expect((await start()).status).toBe(503);
  expect(startGrandpaQuest).not.toHaveBeenCalled();
});

test('refuses an unknown language', async () => {
  expect((await start('xx')).status).toBe(400);
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await start()).status).toBe(401);
});
