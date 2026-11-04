import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { finishDalgona } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ finishDalgona: vi.fn() }));

function finish(body: string) {
  return POST(new Request('http://localhost/api/quests/dalgona/finish', { method: 'POST', body }));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('finishes with the presses of the signed-in player', async () => {
  const result = {
    status: 'carved' as const,
    shape: 'star' as const,
    coins: 150,
    wallet: { coins: 1150, boosters: {} },
  };
  vi.mocked(finishDalgona).mockResolvedValue(result);

  const response = await finish('{"presses":[[0,800],[1200,2000]]}');

  expect(await response.json()).toEqual(result);
  expect(finishDalgona).toHaveBeenCalledWith('player-1', [
    [0, 800],
    [1200, 2000],
  ]);
});

test('reports a game that cannot be finished', async () => {
  vi.mocked(finishDalgona).mockResolvedValue(null);

  expect((await finish('not json')).status).toBe(409);
  expect(finishDalgona).toHaveBeenCalledWith('player-1', undefined);
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await finish('{}')).status).toBe(401);
});

test('hides database errors from the player', async () => {
  vi.mocked(finishDalgona).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await finish('{}');

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
