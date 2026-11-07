import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { finishRamenShift } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ finishRamenShift: vi.fn() }));

function finish(job: string, body: string) {
  return POST(
    new Request(`http://localhost/api/quests/ramen/finish?job=${job}`, { method: 'POST', body }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('finishes the shift of the signed-in player with their presses', async () => {
  const result = {
    score: 9,
    mistakes: 1,
    coins: 120,
    wasAlreadyPaid: false,
    wallet: { coins: 1120, boosters: {} },
  };
  vi.mocked(finishRamenShift).mockResolvedValue(result);

  const response = await finish('kitchen', '{"actions":[[0,0],[400,3]]}');

  expect(await response.json()).toEqual(result);
  expect(finishRamenShift).toHaveBeenCalledWith('player-1', 'kitchen', [
    [0, 0],
    [400, 3],
  ]);
});

test('reports a shift that cannot be finished', async () => {
  vi.mocked(finishRamenShift).mockResolvedValue(null);

  expect((await finish('dishes', '{"actions":[]}')).status).toBe(409);
});

test('rejects a job the shop does not have', async () => {
  expect((await finish('cleaning', '{}')).status).toBe(400);
  expect(finishRamenShift).not.toHaveBeenCalled();
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await finish('service', '{}')).status).toBe(401);
});

test('hides database errors from the player', async () => {
  vi.mocked(finishRamenShift).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await finish('service', '{"actions":[]}');

  expect(response.status).toBe(503);
  expect(JSON.stringify(await response.json())).not.toContain('secret-host');
});
