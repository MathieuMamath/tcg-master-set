import { NextRequest } from 'next/server';
import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { flipGrandpaCard } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ flipGrandpaCard: vi.fn() }));

function flip(position: string) {
  return POST(new NextRequest(`http://localhost/api/quests/grandpa/flip?position=${position}`));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('flips the card for the signed-in player', async () => {
  const answer = {
    face: 2,
    isMatch: null,
    moves: 0,
    status: 'playing' as const,
    wallet: { coins: 100, boosters: {} },
  };
  vi.mocked(flipGrandpaCard).mockResolvedValue(answer);

  const response = await flip('3');

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(answer);
  expect(flipGrandpaCard).toHaveBeenCalledWith('player-1', 3);
});

test('reports a card that cannot be flipped', async () => {
  vi.mocked(flipGrandpaCard).mockResolvedValue(null);

  expect((await flip('3')).status).toBe(409);
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await flip('3')).status).toBe(401);
});

test('hides database errors from the player', async () => {
  vi.mocked(flipGrandpaCard).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await flip('3');

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
