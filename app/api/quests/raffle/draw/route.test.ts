import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { drawRaffleBall } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ drawRaffleBall: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('draws a ball for the signed-in player', async () => {
  const draw = {
    hasDrawn: true as const,
    outcome: 'prize' as const,
    coins: 300,
    wallet: { coins: 1300, boosters: {} },
  };
  vi.mocked(drawRaffleBall).mockResolvedValue(draw);

  const response = await POST();

  expect(await response.json()).toEqual(draw);
  expect(drawRaffleBall).toHaveBeenCalledWith('player-1');
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await POST()).status).toBe(401);
  expect(drawRaffleBall).not.toHaveBeenCalled();
});

test('hides database errors from the player', async () => {
  vi.mocked(drawRaffleBall).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await POST();

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
