import { beforeEach, expect, test, vi } from 'vitest';
import { isAdmin } from '@/auth/roles';
import { getPlayer } from '@/auth/session';
import { loadGameStats } from '@/stats/game-stats';
import { GET } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/auth/roles', () => ({ isAdmin: vi.fn() }));
vi.mock('@/stats/game-stats', () => ({ loadGameStats: vi.fn() }));

function read(period: string) {
  return GET(new Request(`http://localhost/api/stats?period=${period}`));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(loadGameStats).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
  vi.mocked(isAdmin).mockResolvedValue(true);
});

test('gives an admin the statistics of the period', async () => {
  vi.mocked(loadGameStats).mockResolvedValue({ period: 'week' } as never);

  const response = await read('week');

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ period: 'week' });
  expect(loadGameStats).toHaveBeenCalledWith('week');
});

test('refuses a player who is not an admin', async () => {
  vi.mocked(isAdmin).mockResolvedValue(false);

  expect((await read('week')).status).toBe(403);
  expect(loadGameStats).not.toHaveBeenCalled();
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await read('week')).status).toBe(401);
  expect(loadGameStats).not.toHaveBeenCalled();
});

test('refuses a period it does not know', async () => {
  expect((await read('year')).status).toBe(400);
});

test('hides database errors from the player', async () => {
  vi.mocked(loadGameStats).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await read('day');

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
