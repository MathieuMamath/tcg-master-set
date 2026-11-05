import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { sleepUntilMorning } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ sleepUntilMorning: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
  vi.mocked(sleepUntilMorning).mockReset();
});

test('refuses a player who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await POST()).status).toBe(401);
  expect(sleepUntilMorning).not.toHaveBeenCalled();
});

test('sends back the clock moved on to the morning', async () => {
  vi.mocked(sleepUntilMorning).mockResolvedValue(420);

  const response = await POST();

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ clockOffset: 420 });
  expect(sleepUntilMorning).toHaveBeenCalledWith('player-1');
});

test('refuses to sleep by day', async () => {
  vi.mocked(sleepUntilMorning).mockResolvedValue(null);

  const response = await POST();

  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ error: 'not-sleepy' });
});

test('hides a failure behind a 503', async () => {
  vi.mocked(sleepUntilMorning).mockRejectedValue(new Error('database down'));

  expect((await POST()).status).toBe(503);
});
