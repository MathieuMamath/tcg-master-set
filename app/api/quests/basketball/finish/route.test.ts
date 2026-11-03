import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { finishBasketball } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ finishBasketball: vi.fn() }));

function finish(body: string) {
  return POST(
    new Request('http://localhost/api/quests/basketball/finish', { method: 'POST', body }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('finishes with the shots of the signed-in player', async () => {
  const result = {
    score: 21,
    highScore: 30,
    isNewHighScore: false,
    reward: 'coins' as const,
    wasAlreadyPaid: false,
    boosterSetId: null,
    wallet: { coins: 100, boosters: {} },
  };
  vi.mocked(finishBasketball).mockResolvedValue(result);

  const response = await finish('{"shots":[500,1500]}');

  expect(await response.json()).toEqual(result);
  expect(finishBasketball).toHaveBeenCalledWith('player-1', [500, 1500]);
});

test('reports a game that cannot be finished', async () => {
  vi.mocked(finishBasketball).mockResolvedValue(null);

  expect((await finish('not json')).status).toBe(409);
  expect(finishBasketball).toHaveBeenCalledWith('player-1', undefined);
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await finish('{}')).status).toBe(401);
});

test('hides database errors from the player', async () => {
  vi.mocked(finishBasketball).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await finish('{}');

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
